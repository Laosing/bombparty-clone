import { nanoid } from "nanoid"
import serialize from "serialize-javascript"
import { Timer } from "easytimer.js"
import { readFileSync } from "fs"
import { getRandomLettersFn } from "./data/randomLetters.js"
import { log } from "./index.js"

// import dictionary from "./data/wordlist.json" assert { type: "json" }
const dictionary = JSON.parse(readFileSync("./data/wordlist.json"))

const getRandomLetters = getRandomLettersFn(Object.keys(dictionary))

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const ALPHABET = "abcdefghijklmnopqrstuvwxyz"
const LETTER_BONUS = 10

const rooms = new Map()

function connection(io, socket) {
  let _firstRound = true
  let _roomId
  let _countDownInterval

  socket.on("leaveRoom", disconnect)
  socket.on("joinRoom", joinRoom)
  socket.on("getRooms", getRooms)
  socket.on("joinGame", joinGame)
  socket.on("leaveGame", leaveGame)
  socket.on("kickPlayer", leaveGame)
  socket.on("setSettings", setSettings)
  socket.on("checkWord", checkWord)
  socket.on("setGlobalInputText", setGlobalInputText)
  socket.on("startGame", startCountDown)
  socket.on("startGameNoCounter", startGameClearCounter)
  socket.on("stopGame", stopGame)
  socket.on("getRoom", relayRoom)
  socket.on("updateName", updateName)
  socket.on("updateAvatar", updateAvatar)
  socket.on("message", handleMessage)
  socket.on("disconnect", disconnect)
  socket.on("connect_error", (err) => {
    log.red(`connect_error due to ${err.message}`)
  })
  socket.onAny((eventName, ...args) => log.yellow(eventName, ...args))

  function joinRoom(roomId, isPrivate, name) {
    _roomId = roomId

    initializeRoom()
    getRoom(isPrivate)
    initializeUser(name)
    setSettings()

    socket.join(_roomId)
    getRooms()
    relayRoom()
  }

  function initializeRoom() {
    const room = rooms.get(_roomId)
    if (!room) {
      rooms.set(_roomId, new Map())
    }
  }

  function getRooms() {
    const clients = Array.from(io.sockets.adapter.sids.keys())
    const gameRooms = Array.from(io.sockets.adapter.rooms).filter(
      ([id]) => !clients.includes(id)
    )
    const roomsWithPrivate = gameRooms.map(([room, players]) => [
      room,
      {
        players,
        isPrivate: Boolean(rooms.get(room).get("private"))
      }
    ])
    // console.dir(io.sockets.adapter.rooms)
    io.emit("getRooms", serialize(roomsWithPrivate))
  }

  function joinGame(userId) {
    const { users } = getRoom()
    const user = users.get(userId)
    users.set(userId, { ...user, inGame: true, score: 0 })
    io.sockets.in(_roomId).emit("userJoined", userId)
    relayRoom()
  }

  function leaveGame(userId) {
    const { users } = getRoom()
    const user = users.get(userId)
    users.set(userId, { ...user, inGame: false })
    relayRoom()
  }

  function setLetterBlend() {
    const { room } = getRoom()
    const [letters, word] = getRandomLetters()
    log.magenta("word", word)
    room.set("letterBlend", letters)
    room.set("letterBlendWord", word)
  }

  function relayRoom() {
    const { room } = getRoom()
    io.sockets.in(_roomId).emit("getRoom", serialize(room))
  }

  function setGlobalInputText(text = "") {
    io.sockets.in(_roomId).emit("setGlobalInputText", text)
  }

  function updateName(value, userId) {
    if (!value) return
    const { users, messages, room } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, name: value })
    const updateMessages = [...messages].map((m) => ({
      ...m,
      user: { ...m.user, name: m.user.id === userId ? value : m.user.name }
    }))
    room.set("messages", new Set(updateMessages))
    relayRoom()
  }

  function updateAvatar(userId) {
    const { users } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, avatar: nanoid() })
    relayRoom()
  }

  function setHeartLetters(userId, value) {
    const { users } = getRoom()
    const user = users.get(userId)

    const letters = new Set([...user.letters, ...value.split("")])
    const bonusletter = getBonusLetters(value, letters)
    const newLetters = new Set([...letters, ...bonusletter])

    if (newLetters.size >= 26) {
      users.set(userId, {
        ...user,
        lives: Number(user.lives) >= 10 ? 10 : Number(user.lives) + 1,
        letters: new Set(),
        bonusLetters: new Set()
      })
      io.sockets.in(_roomId).emit("gainedHeart", userId)
    } else {
      users.set(userId, {
        ...user,
        letters: newLetters,
        bonusLetters: new Set([...user.bonusLetters, ...bonusletter])
      })
    }
  }

  function getBonusLetters(value, letters) {
    if (value.length > LETTER_BONUS) {
      const lettersArray = [...letters]
      const remainingLetters = ALPHABET.split("").filter(
        (l) => !lettersArray.includes(l)
      )
      const randomLetter = getRandomElement(remainingLetters)
      io.sockets.in(_roomId).emit("bonusLetter", randomLetter)
      return randomLetter || ""
    }
    return ""
  }

  function checkWord(value, userId) {
    const { letterBlend, words, currentPlayer, timerConstructor } = getRoom()
    const isBlend = value.includes(letterBlend.toLowerCase())
    const isDictionary = !!dictionary[value]
    const isUnique = !words.has(value)
    const isLongEnough = value.length >= 3
    const isCurrentPlayer = currentPlayer === userId

    if (
      isBlend &&
      isDictionary &&
      isUnique &&
      isLongEnough &&
      isCurrentPlayer
    ) {
      log.green(`valid word: ${value}`)
      io.sockets
        .in(_roomId)
        .emit("wordValidation", true, { value, letterBlend, currentPlayer })
      words.add(value)
      setPlayerText(userId, value)
      setHeartLetters(userId, value)
      resetletterBlendCounter()
      setLetterBlend()
      timerConstructor.reset()
      switchPlayer()
    } else {
      log.green(`invalid word: ${value}`)
      io.sockets.in(_roomId).emit("wordValidation", false, {
        isBlend,
        isDictionary,
        isUnique,
        isLongEnough,
        currentPlayer
      })
      setPlayerText(userId, "")
    }
    setGlobalInputText()
    relayRoom()
  }

  function switchPlayer() {
    const { room, users, currentPlayer } = getRoom()
    const nextPlayer = !currentPlayer
      ? getRandomPlayer(users)
      : getNextPlayer(users)
    room.set("currentPlayer", nextPlayer)
    setPlayerText(nextPlayer, "")
  }

  function loseLife() {
    const { users, currentPlayer } = getRoom()
    const player = users.get(currentPlayer)
    if (player) {
      const lives = player.lives > 0 ? player.lives - 1 : 0
      users.set(currentPlayer, { ...player, lives })
    }
  }

  function setPlayerText(userId, text) {
    const { users, letterBlend } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, text, letterBlend })
  }

  function resetTimer() {
    const { room, timerConstructor, hardMode, settings } = getRoom()
    const settingsTimer = settings.get("timer")
    const hardModeEnabled = settings.get("hardModeEnabled")
    if (hardModeEnabled && hardMode && settingsTimer > 1) {
      const num = getRandomInt(0, Math.ceil(settingsTimer / 2))
      const seconds = settingsTimer - num
      timerConstructor.stop()
      timerConstructor.start({ startValues: { seconds } })
      room.set("timer", seconds)
    } else {
      room.set("timer", settingsTimer)
    }
  }

  function updateTimer() {
    const { room, timerConstructor, users, currentPlayer } = getRoom()

    checkNoUsers()
    const leftGame = !Array.from(users).find(([id]) => id === currentPlayer)
    if (leftGame) {
      switchPlayer()
      timerConstructor.reset()
    }

    const { seconds } = timerConstructor.getTimeValues()
    room.set("timer", seconds)
    if (seconds > 0) {
      relayRoom()
    }
  }

  function updateSecondsTimer() {
    const {
      timerConstructor,
      currentPlayer,
      letterBlend,
      letterBlendWord,
      letterBlendCounter
    } = getRoom()
    const wordDetails =
      letterBlendCounter <= 1 ? [letterBlend, letterBlendWord] : ["", ""]
    io.sockets.in(_roomId).emit("boom", [currentPlayer, ...wordDetails])
    loseLife()
    const hasWinner = checkGameState()
    if (!hasWinner) {
      switchPlayer()
      switchletterBlend()
      timerConstructor.reset()
    }
    relayRoom()
  }

  function resetletterBlendCounter() {
    const { room, settings } = getRoom()
    const settingsLetterBlendCounter = settings.get("letterBlendCounter")
    room.set("letterBlendCounter", settingsLetterBlendCounter)
  }

  function switchletterBlend() {
    const { room, letterBlendCounter } = getRoom()
    const counter = letterBlendCounter - 1
    room.set("letterBlendCounter", counter)
    if (counter <= 0) {
      resetletterBlendCounter()
      setLetterBlend()
    }
  }

  function startGameClearCounter() {
    clearInterval(_countDownInterval)
    startGame()
    io.sockets.in(_roomId).emit("startCountDown", undefined)
  }

  function startCountDown() {
    const { room } = getRoom()
    room.set("isCountDown", true)
    let countDown = 5
    const countDownFn = () => {
      countDown = countDown - 1
      io.sockets.in(_roomId).emit("startCountDown", countDown)
      if (countDown <= 0) {
        startGameClearCounter()
      }
    }
    _countDownInterval = setInterval(countDownFn, 1000)
    io.sockets.in(_roomId).emit("startCountDown", countDown)
    relayRoom()
  }

  function startGame() {
    const { room, settings, timerConstructor } = getRoom()

    // No players, don't start the game
    if (checkNoUsers()) return

    const startTimer = settings.get("timer")
    room
      .set("timer", startTimer)
      .set("running", true)
      .set("words", new Set())
      .set("round", 1)
      .set("hardMode", false)
      .set("startingPlayer", "")
      .set("isCountDown", false)

    _firstRound = true
    setLetterBlend()
    resetletterBlendCounter()
    resetUser()
    switchPlayer()

    timerConstructor.on("started", updateTimer)
    timerConstructor.on("reset", resetTimer)
    timerConstructor.on("secondsUpdated", updateTimer)
    timerConstructor.on("targetAchieved", updateSecondsTimer)

    timerConstructor.start({ startValues: { seconds: startTimer } })
  }

  function checkGameState() {
    const { users } = getRoom()
    const players = Array.from(users).filter(([, val]) => val.inGame)
    const remainingPlayers = players.filter(([, val]) => val.lives > 0)
    const lastPlayer = remainingPlayers.length <= 1
    const singlePlayer = players.length === 1 ? players[0][1].lives <= 1 : false
    const hasWinner = players.length === 1 ? singlePlayer : lastPlayer
    if (hasWinner) {
      io.sockets.in(_roomId).emit("winner", true)
      const [userId, winner] = remainingPlayers[0] || players[0]
      users.set(userId, { ...winner, score: winner.score + 1 })
      stopGame(winner)
    }
    return hasWinner
  }

  function stopGame(player) {
    const { room, timerConstructor } = getRoom()
    timerConstructor.stop()
    timerConstructor.removeAllEventListeners()
    room
      .set("winner", player)
      .set("running", false)
      .set("currentPlayer", "")
      .set("letterBlend", "")
      .set("letterBlendWord", "")
    relayRoom()
  }

  function resetUser() {
    const { room, users, settings } = getRoom()
    const lives = settings.get("lives")
    const updatedUsers = Array.from(users, ([key, value]) => {
      return [
        key,
        {
          ...value,
          letters: new Set(),
          lives,
          text: "",
          bonusLetters: new Set()
        }
      ]
    })
    room.set("users", new Map(updatedUsers))
  }

  function checkIncrementRound(players) {
    const { currentPlayer, startingPlayer, room } = getRoom()

    if (!players.find(([id, val]) => id === startingPlayer && val?.lives > 0)) {
      room.set("startingPlayer", currentPlayer)
    }
    if (currentPlayer === startingPlayer) {
      if (players.length === 1) return incrementRound()
      if (_firstRound) {
        _firstRound = false
      } else {
        incrementRound()
      }
    }
  }

  function incrementRound() {
    const { room, round, settings } = getRoom()
    const hardMode = settings.get("hardMode")
    const hardModeEnabled = settings.get("hardModeEnabled")
    const newRound = round + 1
    if (hardModeEnabled && newRound > hardMode) {
      room.set("hardMode", true)
    }
    room.set("round", newRound)
  }

  function getNextPlayer(collection) {
    const { currentPlayer } = getRoom()
    const players = [...collection].filter(([, val]) => val.inGame)

    checkIncrementRound(players)

    let currentIndex = players.findIndex(([key]) => key === currentPlayer)
    if (currentIndex === players.length - 1) currentIndex = 0

    let nextPlayerId
    for (let i = currentIndex; i < players.length; i++) {
      const player = players[i]
      if (!player) continue

      const [id, val] = player
      if (val.lives <= 0 || id === currentPlayer) continue
      nextPlayerId = id
      break
    }

    if (!nextPlayerId) {
      const remainingPlayers = players.filter(([, val]) => val.lives > 0)
      nextPlayerId = remainingPlayers[0][0]
    }

    return nextPlayerId
  }

  function getRandomPlayer(collection) {
    const { room } = getRoom()
    const keys = Array.from(collection)
      .filter(([, val]) => val.inGame)
      .map(([id]) => id)
    const randomPlayer = getRandomElement(keys)
    room.set("startingPlayer", randomPlayer)
    return randomPlayer
  }

  function getRoom(isPrivate) {
    const room = rooms.get(_roomId) || rooms.set("null_room", new Map())
    const setProp = (prop, initialValue) =>
      room.get(prop) || room.set(prop, initialValue).get(prop)

    const props = {
      messages: setProp("messages", new Set()),
      users: setProp("users", new Map()),
      words: setProp("words", new Set()),
      letterBlend: setProp("letterBlend", ""),
      letterBlendWord: setProp("letterBlendWord", ""),
      letterBlendCounter: setProp("letterBlendCounter", 0),
      timerConstructor: setProp(
        "timerConstructor",
        new Timer({ countdown: true })
      ),
      timer: setProp("timer", 0),
      round: setProp("round", 0),
      hardMode: setProp("hardMode", false),
      currentPlayer: setProp("currentPlayer", ""),
      startingPlayer: setProp("startingPlayer", ""),
      running: setProp("running", false),
      winner: setProp("winner", null),
      settings: setProp("settings", new Map()),
      private: setProp("private", Boolean(isPrivate)),
      isCountDown: setProp("isCountDown", false)
    }

    return { room, ...props }
  }

  function initializeUser(name) {
    const { userId } = socket.handshake.auth
    const { users } = getRoom()
    users.set(userId, {
      id: userId,
      name,
      letters: new Set(),
      avatar: nanoid(),
      inGame: false,
      score: 0,
      bonusLetters: new Set()
    })
  }

  function setSettings(data) {
    const { settings } = getRoom()

    const timer = data?.timer || settings.get("timer") || 10
    const lives = data?.lives || settings.get("lives") || 2
    const hardMode = data?.hardMode || settings.get("hardMode") || 5
    const hardModeEnabled =
      data?.hardModeEnabled ?? settings.get("hardModeEnabled") ?? true
    const letterBlendCounter =
      data?.letterBlendCounter || settings.get("letterBlendCounter") || 2
    settings
      .set("timer", Number(timer))
      .set("lives", lives)
      .set("hardMode", hardMode)
      .set("hardModeEnabled", hardModeEnabled)
      .set("letterBlendCounter", letterBlendCounter)
    if (data) {
      io.sockets.in(_roomId).emit("setSettings", serialize(settings))
      relayRoom()
    }
  }

  function handleMessage(value) {
    const { userId } = socket.handshake.auth

    const { messages, users } = getRoom()
    const message = {
      id: nanoid(),
      user: users.get(userId),
      value,
      time: Date.now()
    }

    messages.add(message)
    relayRoom()
  }

  function removeUserFromRoom(userId) {
    const { users } = getRoom()
    users.delete(userId)
    if (_roomId) {
      io.sockets.in(_roomId).emit("userLeft")
      socket.leave(_roomId)
    }
  }

  function disconnect(reason) {
    if (!_roomId) return
    if (reason) console.log({ reason })

    const { userId } = socket.handshake.auth
    const { users } = getRoom()
    leaveGame(userId)
    removeUserFromRoom(userId)
    // Stop game if no users left
    checkNoUsers()
    relayRoom()
    if (users.size === 0 && _roomId) {
      log.red(`Deleting room: ${_roomId}`)
      rooms.delete(_roomId)
    }
  }

  function checkNoUsers() {
    const { users } = getRoom()
    if ([...users].filter(([, val]) => val.inGame) <= 0) {
      stopGame()
      return true
    }
  }
}

function game(io) {
  // io.use(userHandler)
  io.on("connection", (socket) => {
    connection(io, socket)
  })
}

export default game
