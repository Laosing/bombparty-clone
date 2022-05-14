const { nanoid } = require("nanoid")
const serialize = require("serialize-javascript")
const Timer = require("easytimer.js").Timer

const dictionary = require("./data/wordlist.json")
const { getRandomLetters } = require("./data/randomLetters")

const rooms = new Map()

function connection(io, socket) {
  const { roomId } = socket.handshake.query

  socket.join(roomId)

  getRoom()
  // handleMessage("joined the room!")

  initializeUser()
  setSettings()

  socket.on("setSettings", (value) => setSettings(value))
  socket.on("checkWord", (value, userId) => checkWord(value, userId))
  socket.on("setPlayerText", (value, userId) => setPlayerText(value, userId))
  socket.on("startGame", () => startGame())
  socket.on("stopGame", () => stopGame())
  socket.on("switchPlayer", () => switchPlayer())
  socket.on("getRoom", () => relayRoom())
  socket.on("updateName", (value, userId) => updateName(value, userId))
  socket.on("updateAvatar", (userId) => updateAvatar(userId))
  socket.on("message", (value) => handleMessage(value))
  socket.on("disconnect", (reason) => disconnect(reason))
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`)
  })

  function relayRoom() {
    const { roomId, room } = getRoom()
    io.sockets.in(roomId).emit("getRoom", serialize(room))
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

  function setUserLetters(value, userId) {
    const { users } = getRoom()
    const user = users.get(userId)
    const letters = new Set([...user.letters, ...value.split("")])
    if (letters.size >= 26) {
      users.set(userId, { ...user, lives: user.lives + 1, letters: new Set() })
    } else {
      users.set(userId, { ...user, letters })
    }
  }

  function checkWord(value, userId) {
    const {
      roomId,
      room,
      letterBlend,
      words,
      currentPlayer,
      timerConstructor
    } = getRoom()

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
      console.log(`valid word: ${value}`)
      io.sockets
        .in(roomId)
        .emit("wordValidation", true, { value, letterBlend, currentPlayer })
      words.add(value)
      setUserLetters(value, userId)
      resetletterBlendCounter()
      room.set("letterBlend", getRandomLetters())
      timerConstructor.reset()
      switchPlayer()
    } else {
      console.log(`invalid word: ${value}`)
      io.sockets.in(roomId).emit("wordValidation", false, {
        isBlend,
        isDictionary,
        isUnique,
        isLongEnough,
        currentPlayer
      })
      setPlayerText("", userId, false)
    }
    relayRoom()
  }

  function switchPlayer() {
    const { room, users, currentPlayer } = getRoom()
    const nextPlayer = !currentPlayer
      ? getRandomKey(users)
      : getNextPlayer(users)
    room.set("currentPlayer", nextPlayer)
    setPlayerText("", nextPlayer, false)
  }

  function loseLife() {
    const { users, currentPlayer } = getRoom()
    const player = users.get(currentPlayer)
    if (player) {
      const lives = player.lives > 0 ? player.lives - 1 : 0
      users.set(currentPlayer, { ...player, lives })
    }
  }

  function setPlayerText(text, userId, relay = true) {
    const { users } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, text })
    relay && relayRoom()
  }

  function updateTimer() {
    const { room, timerConstructor } = getRoom()
    const { seconds } = timerConstructor.getTimeValues()
    room.set("timer", seconds)
    return { seconds, timerConstructor }
  }

  function updateSecondsTimer() {
    const { seconds, timerConstructor } = updateTimer()
    if (seconds === 0) {
      io.sockets.in(roomId).emit("boom", true)
      loseLife()
      const hasWinner = checkGameState()
      if (!hasWinner) {
        switchPlayer()
        decrementletterBlendCounter()
        timerConstructor.reset()
      }
    }
    relayRoom()
  }

  function resetletterBlendCounter() {
    const { room, settings } = getRoom()
    const settingsLetterBlendCounter = settings.get("letterBlendCounter")
    room.set("letterBlendCounter", settingsLetterBlendCounter)
  }

  function decrementletterBlendCounter() {
    const { room, letterBlendCounter, settings } = getRoom()
    const counter = letterBlendCounter - 1
    room.set("letterBlendCounter", counter)
    if (counter <= 0) {
      const settingsLetterBlendCounter = settings.get("letterBlendCounter")
      room.set("letterBlend", getRandomLetters())
      room.set("letterBlendCounter", settingsLetterBlendCounter)
    }
  }

  function startGame() {
    const { room, settings, timerConstructor } = getRoom()
    const startTimer = settings.get("timer")
    room.set("timer", startTimer)
    room.set("running", true)
    room.set("letterBlend", getRandomLetters())
    room.set("words", new Set())
    resetletterBlendCounter()
    resetUser()
    switchPlayer()

    timerConstructor.start({ startValues: { seconds: startTimer } })

    timerConstructor.on("started", updateTimer)
    timerConstructor.on("reset", updateTimer)
    timerConstructor.on("secondsUpdated", updateSecondsTimer)

    relayRoom()
  }

  function checkGameState() {
    const { users } = getRoom()
    const remainingPlayers = Array.from(users).filter(([, value]) =>
      Boolean(value.lives)
    )
    const hasWinner = remainingPlayers.length <= 1
    if (hasWinner) {
      io.sockets.in(roomId).emit("winner", true)
      const [, winner] = remainingPlayers?.[0] || [...users][0]
      stopGame(winner)
    }
    return hasWinner
  }

  function stopGame(player) {
    const { room, timerConstructor } = getRoom()
    timerConstructor.stop()
    timerConstructor.removeAllEventListeners()
    room.set("winner", player)
    room.set("running", false)
    room.set("currentPlayer", "")
    room.set("letterBlend", "")
    // resetUser()
    relayRoom()
  }

  function resetUser() {
    const { room, users, settings } = getRoom()
    const lives = settings.get("lives")
    const updatedUsers = Array.from(users, ([key, value]) => {
      return [key, { ...value, letters: new Set(), lives, text: "" }]
    })
    room.set("users", new Map(updatedUsers))
  }

  function getNextPlayer(collection) {
    const { currentPlayer } = getRoom()

    const players = [...collection]
    let currentIndex = players.findIndex(([key]) => key === currentPlayer)
    if (currentIndex === players.length - 1) currentIndex = 0

    let nextPlayerId
    for (let i = currentIndex; i < players.length; i++) {
      const [id, val] = players[i]
      if (val.lives <= 0 || id === currentPlayer) continue
      nextPlayerId = id
      break
    }
    if (!nextPlayerId) {
      nextPlayerId = players[0][0]
    }

    return nextPlayerId
  }

  function getRandomKey(collection) {
    const keys = Array.from(collection.keys())
    return keys[Math.floor(Math.random() * keys.length)]
  }

  function setProp(room, prop, initialValue) {
    return room.get(prop) || room.set(prop, initialValue).get(prop)
  }

  function getRoom() {
    // console.log(rooms)
    const { roomId } = socket.handshake.query
    const room = rooms.get(roomId) || rooms.set(roomId, new Map())
    const props = {
      messages: setProp(room, "messages", new Set()),
      users: setProp(room, "users", new Map()),
      words: setProp(room, "words", new Set()),
      letterBlend: setProp(room, "letterBlend", ""),
      timerConstructor: setProp(
        room,
        "timerConstructor",
        new Timer({ countdown: true })
      ),
      timer: setProp(room, "timer", 0),
      currentPlayer: setProp(room, "currentPlayer", ""),
      running: setProp(room, "running", false),
      winner: setProp(room, "winner", null),
      letterBlendCounter: setProp(room, "letterBlendCounter", 0),
      settings: setProp(room, "settings", new Map())
    }

    return { room, roomId, ...props }
  }

  function initializeUser() {
    const { name, userId } = socket.handshake.auth
    const { users } = getRoom()
    users.set(userId, {
      id: userId,
      name,
      letters: new Set(),
      avatar: nanoid()
    })
    io.sockets.in(roomId).emit("userJoined", userId)
  }

  function setSettings(data) {
    const { settings } = getRoom()

    const timer = data?.timer || settings.get("timer") || 10
    const lives = data?.lives || settings.get("lives") || 2
    const letterBlendCounter =
      data?.letterBlendCounter || settings.get("letterBlendCounter") || 2
    settings
      .set("timer", Number(timer))
      .set("lives", lives)
      .set("letterBlendCounter", letterBlendCounter)
    if (data) {
      io.sockets.in(roomId).emit("setSettings", serialize(settings))
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

    // setTimeout(() => {
    //   messages.delete(message)
    //   io.sockets.emit("deleteMessage", message.id)
    // }, messageExpirationTimeMS)
  }

  function disconnect(reason) {
    const { userId } = socket.handshake.auth
    const { users } = getRoom()
    // handleMessage("left the room")
    console.log({ reason })
    users.delete(userId)
    stopGame()
    // socket.leave(roomId)
    // socket.disconnect(true)
    relayRoom()
  }
}

function chat(io) {
  // io.use(userHandler)
  io.on("connection", (socket) => {
    connection(io, socket)
  })
}

module.exports = chat
