const { nanoid } = require("nanoid")
const serialize = require("serialize-javascript")
const Timer = require("easytimer.js").Timer

const dictionary = require("./data/wordlist.json")
const { getRandomLetters } = require("./data/randomLetters")

const timer = new Timer({ countdown: true })

const rooms = new Map()

// async function userHandler(socket, next) {
//   const { name } = socket.handshake.auth
//   if (name) {
//     try {
//       users.set(socket, {
//         name
//       })
//     } catch (error) {
//       console.log(error)
//     }
//   }

//   next()
// }

function connection(io, socket) {
  const { roomId } = socket.handshake.query

  socket.join(roomId)

  getRoom()
  // handleMessage("joined the room!")

  initializeUser()
  setSettings()

  socket.on("setSettings", (value) => setSettings(JSON.parse(value)))
  socket.on("checkWord", (value, userId) => checkWord(value, userId))
  socket.on("setPlayerText", (value, userId) => setPlayerText(value, userId))
  socket.on("startGame", () => startGame())
  socket.on("stopGame", () => stopGame())
  socket.on("switchPlayer", () => switchPlayer())
  socket.on("getRoom", () => relayRoom())
  socket.on("updateName", (value, userId) => updateName(value, userId))
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

  function checkWord(value, userId) {
    const { roomId, room, letterBlend, words } = getRoom()

    const isBlend = value.includes(letterBlend.toLowerCase())
    const isDictionary = dictionary[value]
    const isUnique = !words.has(value)
    const isLongEnough = value.length >= 3

    if (isBlend && isDictionary && isUnique && isLongEnough) {
      console.log(`valid word: ${value}`)
      io.sockets
        .in(roomId)
        .emit("wordValidation", "valid", JSON.stringify({ value, letterBlend }))
      words.add(value)
      room.set("letterBlend", getRandomLetters())
      timer.reset()
      switchPlayer()
    } else {
      console.log(`invalid word: ${value}`)
      io.sockets.in(roomId).emit(
        "wordValidation",
        "invalid",
        JSON.stringify({
          isBlend,
          isDictionary,
          isUnique,
          isLongEnough
        })
      )
      setPlayerText("", userId, false)
    }
    relayRoom()
  }

  function switchPlayer() {
    const { room, users, currentPlayer } = getRoom()
    if (!currentPlayer) {
      room.set("currentPlayer", getRandomKey(users))
    } else {
      room.set("currentPlayer", getNextPlayer(users))
    }
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
    const { room } = getRoom()
    const { seconds } = timer.getTimeValues()
    room.set("timer", seconds)
    return { seconds }
  }

  function updateSecondsTimer() {
    const { seconds } = updateTimer()
    if (seconds === 0) {
      loseLife()
      const hasWinner = checkGameState()
      if (!hasWinner) {
        switchPlayer()
        decrementletterBlendCounter()
        timer.reset()
      }
    }
    relayRoom()
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
    const { room, settings } = getRoom()
    const startTimer = settings.get("timer")
    const letterBlendCounter = settings.get("letterBlendCounter")
    room.set("timer", startTimer)
    room.set("letterBlendCounter", letterBlendCounter)
    room.set("running", true)
    room.set("letterBlend", getRandomLetters())
    room.set("words", new Set())
    resetUserLives()
    switchPlayer()

    timer.start({ startValues: { seconds: startTimer } })

    timer.on("started", updateTimer)
    timer.on("reset", updateTimer)
    timer.on("secondsUpdated", updateSecondsTimer)

    relayRoom()
  }

  function checkGameState() {
    const { users } = getRoom()
    const remainingPlayers = Array.from(users).filter(([, value]) =>
      Boolean(value.lives)
    )
    const hasWinner = remainingPlayers.length === 1
    if (hasWinner) {
      const [, winner] = remainingPlayers[0]
      stopGame(winner)
    }
    return hasWinner
  }

  function stopGame(player) {
    const { room } = getRoom()
    timer.stop()
    timer.removeAllEventListeners()
    room.set("winner", player)
    room.set("running", false)
    room.set("currentPlayer", "")
    room.set("letterBlend", "")
    resetUserText()
    relayRoom()
  }

  function resetUserLives() {
    const { room, users, settings } = getRoom()
    const lives = settings.get("lives")
    const updatedUsers = Array.from(users, ([key, value]) => {
      return [key, { ...value, lives }]
    })
    room.set("users", new Map(updatedUsers))
  }

  function resetUserText() {
    const { room, users } = getRoom()
    const updatedUsers = Array.from(users, ([key, value]) => {
      return [key, { ...value, text: "" }]
    })
    room.set("users", new Map(updatedUsers))
  }

  function getNextPlayer(collection) {
    const { currentPlayer } = getRoom()
    const remainingPlayers = [...collection].filter(([, val]) =>
      Boolean(val.lives)
    )
    const currentIndex = remainingPlayers.findIndex(
      ([key]) => key === currentPlayer
    )
    const nextIndex = [-1, remainingPlayers.length - 1].includes(currentIndex)
      ? 0
      : currentIndex + 1
    return remainingPlayers[nextIndex][0]
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
    users.set(userId, { id: userId, name })
  }

  function setSettings(data) {
    const { settings } = getRoom()

    const timer = data?.timer || settings.get("timer") || 10
    const lives = data?.lives || settings.get("lives") || 2
    const letterBlendCounter =
      data?.letterBlendCounter || settings.get("letterBlendCounter") || 2
    settings.set("timer", Number(timer))
    settings.set("lives", lives)
    settings.set("letterBlendCounter", letterBlendCounter)
    if (data) {
      io.sockets.in(roomId).emit("setSettings", true)
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
