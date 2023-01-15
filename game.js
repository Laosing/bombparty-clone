import { nanoid } from "nanoid"
import serialize from "serialize-javascript"
import { Timer } from "./Timer.js"
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

const admin = {
  name: "",
}

function connection(io, socket) {
  let _firstRound = true
  let _roomId

  socket.on("resetClient", resetClient)
  socket.on("leaveRoom", disconnect)
  socket.on("joinRoom", joinRoom)
  socket.on("getRooms", getRooms)
  socket.on("joinGame", joinGame)
  socket.on("joinGroup", joinGroup)
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
  socket.on("message", handleUserMessage)
  socket.on("getMessages", relayMessages)
  socket.on("disconnect", disconnect)
  socket.on("connect_error", (err) => {
    log.red(`connect_error due to ${err.message}`)
  })
  socket.onAny((eventName, ...args) => log.yellow(eventName, ...args))

  function joinRoom(roomId, isPrivate, name, avatarSeed) {
    _roomId = roomId

    initializeRoom()
    getRoom(isPrivate)
    initializeUser(name, avatarSeed)
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
        isPrivate: Boolean(rooms.get(room).get("private")),
      },
    ])
    // console.dir(io.sockets.adapter.rooms)
    io.emit("getRooms", serialize(roomsWithPrivate))
  }

  function joinGame(userId) {
    const { users } = getRoom()
    const user = users.get(userId)
    users.set(userId, { ...user, inGame: true, score: 0 })

    initializeGroup(userId)

    io.sockets.in(_roomId).emit("userJoined", userId)
    relayRoom()
    sendAdminMessage(userId, "joined the game")
  }

  function initializeGroup(userId) {
    const { groups, users } = getRoom()
    const id = nanoid()

    groups.set(id, {
      id,
      letters: new Set(),
      score: 0,
      bonusLetters: new Set(),
      members: new Set([userId]),
      activeTyper: 0,
    })

    const user = users.get(userId)
    users.set(userId, { ...user, group: id })
  }

  function joinGroup(groupId, memberId) {
    const { groups, users } = getRoom()
    const user = users.get(memberId)
    const group = groups.get(groupId)

    leaveGroup(memberId)

    if (groupId) {
      groups.set(groupId, {
        ...group,
        members: new Set([memberId, ...group.members]),
      })
      users.set(memberId, { ...user, group: groupId })
    } else {
      initializeGroup(memberId)
    }

    // io.sockets.in(_roomId).emit("joinedGroup", serializeJavascript(groups))
    relayRoom()
  }

  function leaveGroup(memberId) {
    const { groups, users, room } = getRoom()
    const user = users.get(memberId)
    const group = groups.get(user.group)

    if (group) {
      group.members.delete(memberId)
      users.set(memberId, { ...user, group: "" })
      cleanGroups()
    }
    room.set("winner", null)
  }

  function cleanGroups() {
    const { groups } = getRoom()
    groups.forEach((group) => {
      if (group.members.size === 0) {
        groups.delete(group.id)
      }
    })
  }

  function leaveGame(userId, kickerId) {
    const { users } = getRoom()
    const user = users.get(userId)
    users.set(userId, { ...user, inGame: false })

    leaveGroup(userId, true)

    checkNoUsers()

    relayRoom()

    if (kickerId && user) {
      const kickerUser = users.get(kickerId)
      createMessage(
        admin,
        `${kickerUser.name} kicked ${user.name} from the game`
      )
    } else {
      sendAdminMessage(userId, "left the game")
    }
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

  function resetClient() {
    io.sockets.in(_roomId).emit("resetClient")
  }

  function updateName(value, userId) {
    if (!value) return
    const { users, messages, room } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, name: value })
    if (messages.size) {
      const updateMessages = [...messages].map((m) => ({
        ...m,
        user: { ...m.user, name: m.user.id === userId ? value : m.user.name },
      }))
      room.set("messages", new Set(updateMessages))
      relayMessages()
    }
    relayRoom()
  }

  function updateAvatar(userId, newSeed) {
    const { users } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, avatar: newSeed })
    relayRoom()
  }

  function setHeartLetters(groupId, value) {
    const { groups } = getRoom()
    const group = groups.get(groupId)

    const letters = new Set([...group.letters, ...value.split("")])
    const bonusletter = getBonusLetters(value, letters)
    const newLetters = new Set([...letters, ...bonusletter])

    if (newLetters.size >= 26) {
      groups.set(groupId, {
        ...group,
        lives: Number(group.lives) >= 10 ? 10 : Number(group.lives) + 1,
        letters: new Set(),
        bonusLetters: new Set(),
      })
      io.sockets.in(_roomId).emit("gainedHeart", groupId)
    } else {
      groups.set(groupId, {
        ...group,
        letters: newLetters,
        bonusLetters: new Set([...group.bonusLetters, ...bonusletter]),
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

  function checkWord(value, groupId) {
    const { letterBlend, words, currentGroup, timerConstructor } = getRoom()
    const isBlend = value.includes(letterBlend.toLowerCase())
    const isDictionary = !!dictionary[value]
    const isUnique = !words.has(value)
    const isLongEnough = value.length >= 3
    const isCurrentGroup = currentGroup === groupId

    if (isBlend && isDictionary && isUnique && isLongEnough && isCurrentGroup) {
      log.green(`valid word: ${value}`)
      io.sockets
        .in(_roomId)
        .emit("wordValidation", true, { value, letterBlend, currentGroup })
      words.add(value)
      setGroupText(groupId, value)
      setHeartLetters(groupId, value)
      resetletterBlendCounter()
      setLetterBlend()
      timerConstructor.reset()
      switchGroup()
    } else {
      log.green(`invalid word: ${value}`)
      io.sockets.in(_roomId).emit("wordValidation", false, {
        isBlend,
        isDictionary,
        isUnique,
        isLongEnough,
        currentGroup,
      })
      setGroupText(groupId, "")
    }
    setGlobalInputText()
    relayRoom()
  }

  function switchGroup() {
    const { room, groups, currentGroup } = getRoom()
    const nextGroup = !currentGroup
      ? getRandomPlayer(groups)
      : getNextPlayer(groups)
    room.set("currentGroup", nextGroup)
    setGroupText(nextGroup, "")
  }

  function loseLife() {
    const { groups, currentGroup } = getRoom()
    const group = groups.get(currentGroup)
    if (group) {
      const lives = group.lives > 0 ? group.lives - 1 : 0
      groups.set(currentGroup, { ...group, lives })
    }
  }

  function setGroupText(groupId, text) {
    const { groups, letterBlend } = getRoom()
    const group = groups.get(groupId)
    if (group) {
      groups.set(groupId, { ...group, text, letterBlend })
    }
  }

  function resetTimer() {
    const { room, timerConstructor, hardMode, settings } = getRoom()
    const settingsTimer = settings.get("timer")
    const hardModeEnabled = settings.get("hardModeEnabled")
    if (hardModeEnabled && hardMode && settingsTimer > 1) {
      const num = getRandomInt(0, Math.ceil(settingsTimer / 2))
      const seconds = settingsTimer - num
      timerConstructor.setTimer(seconds)
      room.set("timer", seconds)
    } else {
      room.set("timer", settingsTimer)
    }
  }

  function updateTimer() {
    const { room, timerConstructor, groups, currentGroup } = getRoom()

    checkNoUsers()
    const leftGame = !Array.from(groups).find(([id]) => id === currentGroup)
    if (leftGame) {
      switchGroup()
      timerConstructor.reset()
    }

    const seconds = timerConstructor.getTime()
    room.set("timer", seconds)
    if (seconds > 0) {
      relayRoom()
    }
  }

  function onTimerFinish() {
    const {
      timerConstructor,
      currentGroup,
      letterBlend,
      letterBlendWord,
      letterBlendCounter,
    } = getRoom()
    const wordDetails =
      letterBlendCounter <= 1 ? [letterBlend, letterBlendWord] : ["", ""]
    io.sockets.in(_roomId).emit("boom", currentGroup)
    io.sockets.in(_roomId).emit("boomWord", wordDetails)
    loseLife()
    const hasWinner = checkGameState()
    if (!hasWinner) {
      switchGroup()
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

  function startGameClearCounter(userId) {
    const { room } = getRoom()
    clearInterval(room.get("_countDownInterval"))
    startGame()
    io.sockets.in(_roomId).emit("startCountDown", undefined)

    sendAdminMessage(userId, "immediately started the game")
  }

  function startCountDown(userId) {
    const { room, running } = getRoom()

    if (running) return

    const interval = setInterval(countDownFn, 1000)
    const intervalId = interval[Symbol.toPrimitive]()

    room.set("isCountDown", true).set("_countDownInterval", intervalId)

    let countDown = 5
    function countDownFn() {
      if (checkNoUsers()) {
        room.set("isCountDown", false)
        io.sockets.in(_roomId).emit("startCountDown", undefined)
        clearInterval(room.get("_countDownInterval"))
        relayRoom()
        return
      }
      countDown -= 1
      io.sockets.in(_roomId).emit("startCountDown", countDown)
      if (countDown <= 0) {
        startGameClearCounter()
      }
    }

    io.sockets.in(_roomId).emit("startCountDown", countDown)
    relayRoom()

    sendAdminMessage(userId, "started the game")
  }

  function startGame() {
    const { room, settings, timerConstructor } = getRoom()

    // No players, don't start the game
    if (checkNoUsers()) return stopGame()

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
    resetGroup()
    switchGroup()

    timerConstructor.on("reset", resetTimer)
    timerConstructor.on("secondsUpdated", updateTimer)
    timerConstructor.on("targetAchieved", onTimerFinish)

    timerConstructor.start(startTimer)
  }

  function checkGameState() {
    const { groups } = getRoom()
    const _groups = Array.from(groups)
    const remainingGroups = _groups.filter(([, val]) => val.lives > 0)
    const lastGroup = remainingGroups.length <= 1
    const singlePlayer = _groups.length === 1 ? _groups[0][1].lives <= 0 : false
    const hasWinner = _groups.length === 1 ? singlePlayer : lastGroup
    if (hasWinner) {
      io.sockets.in(_roomId).emit("winner", true)
      const [groupId, winner] = remainingGroups[0] || _groups[0]
      groups.set(groupId, { ...winner, score: winner.score + 1 })
      stopGame(winner)
    }
    return hasWinner
  }

  function stopGame(group, userId) {
    const { room, timerConstructor } = getRoom()
    timerConstructor.stop()
    timerConstructor.removeAllEventListeners()
    room
      .set("winner", group)
      .set("running", false)
      .set("currentGroup", "")
      .set("isCountDown", false)
    relayRoom()

    if (userId) {
      sendAdminMessage(userId, "stopped the game")
    }
  }

  function resetGroup() {
    const { room, groups, settings } = getRoom()
    const lives = settings.get("lives")
    const updatedGroup = Array.from(groups, ([key, value]) => [
      key,
      {
        ...value,
        letters: new Set(),
        lives,
        text: "",
        bonusLetters: new Set(),
        activeTyper: 0,
      },
    ])
    room.set("groups", new Map(updatedGroup))
  }

  function checkIncrementRound(groups) {
    const { currentGroup, startingPlayer, room } = getRoom()

    if (!groups.find(([id, val]) => id === startingPlayer && val?.lives > 0)) {
      room.set("startingPlayer", currentGroup)
    }
    if (currentGroup === startingPlayer) {
      if (groups.length === 1) return incrementRound()
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

  function incrementActiveTyper() {
    const { groups, currentGroup } = getRoom()
    const group = groups.get(currentGroup)
    if (group) {
      const activeTyper = group.activeTyper + 1
      groups.set(currentGroup, { ...group, activeTyper })
    }
  }

  function getNextPlayer(collection) {
    const { currentGroup } = getRoom()
    const groups = [...collection].filter(([, val]) => val.members.size)

    incrementActiveTyper()
    checkIncrementRound(groups)

    let currentIndex = groups.findIndex(([key]) => key === currentGroup)
    if (currentIndex === groups.length - 1) currentIndex = 0

    let nextGroupId
    for (let i = currentIndex; i < groups.length; i++) {
      const group = groups[i]
      if (!group) continue

      const [id, val] = group
      if (val.lives <= 0 || id === currentGroup) continue
      nextGroupId = id
      break
    }

    if (!nextGroupId) {
      const remainingGroups = groups.filter(([, val]) => val.lives > 0)
      nextGroupId = remainingGroups[0][0]
    }

    return nextGroupId
  }

  function getRandomPlayer(collection) {
    const { room } = getRoom()
    const keys = Array.from(collection)
      .filter(([, val]) => val.members.size)
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
      groups: setProp("groups", new Map()),
      words: setProp("words", new Set()),
      letterBlend: setProp("letterBlend", ""),
      letterBlendWord: setProp("letterBlendWord", ""),
      letterBlendCounter: setProp("letterBlendCounter", 0),
      timerConstructor: setProp("timerConstructor", new Timer()),
      timer: setProp("timer", 0),
      round: setProp("round", 0),
      hardMode: setProp("hardMode", false),
      currentGroup: setProp("currentGroup", ""),
      startingPlayer: setProp("startingPlayer", ""),
      running: setProp("running", false),
      winner: setProp("winner", null),
      settings: setProp("settings", new Map()),
      private: setProp("private", Boolean(isPrivate)),
      isCountDown: setProp("isCountDown", false),
    }

    return { room, ...props }
  }

  function initializeUser(name, avatarSeed) {
    const { userId } = socket.handshake.auth
    const { users } = getRoom()
    users.set(userId, {
      id: userId,
      name,
      avatar: avatarSeed,
      inGame: false,
      group: "",
    })
  }

  function setSettings(data, userId) {
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

      sendAdminMessage(userId, "changed the settings")
    }
  }

  function sendAdminMessage(userId, message) {
    const { users } = getRoom()
    const user = users.get(userId)
    if (user) {
      createMessage(admin, `${user.name} ${message}`)
    }
  }

  function handleUserMessage(value) {
    const { userId } = socket.handshake.auth
    const { users } = getRoom()
    createMessage(users.get(userId), value)
  }

  function createMessage(user, value) {
    const { messages } = getRoom()
    const message = {
      id: nanoid(),
      user,
      value,
      time: Date.now(),
    }
    messages.add(message)
    relayMessages()
  }

  function relayMessages() {
    const { messages } = getRoom()
    io.sockets.in(_roomId).emit("messages", serialize(messages))
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
    if ([...users].filter(([, val]) => val.inGame).length <= 0) {
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
