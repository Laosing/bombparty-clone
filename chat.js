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
  socket.on("checkWord", (value) => checkWord(value))
  socket.on("setPlayerText", (value) => setPlayerText(value))
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
    const { users } = getRoom()
    const player = users.get(userId)
    users.set(userId, { ...player, name: value })
    relayRoom()
  }

  function checkWord(value) {
    const { roomId, room, letterBlend, words } = getRoom()

    const isBlend = value.includes(letterBlend.toLowerCase())
    const isDictionary = dictionary[value]
    const isUnique = !words.has(value)
    const isLongEnough = value.length >= 3

    if (isBlend && isDictionary && isUnique && isLongEnough) {
      console.log(`valid word: ${value}`)
      io.sockets.in(roomId).emit("wordValidation", "valid")
      words.add(value)
      room.set("letterBlend", getRandomLetters())
      timer.reset()
      switchPlayer()
    } else {
      console.log(`invalid word: ${value}`)
      io.sockets.in(roomId).emit("wordValidation", "invalid")
      setPlayerText("", false)
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

  function setPlayerText(text, relay = true) {
    const { users, currentPlayer } = getRoom()
    const player = users.get(currentPlayer)
    users.set(currentPlayer, { ...player, text })
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
        timer.reset()
      }
    }
    relayRoom()
  }

  function startGame() {
    const { room, settings } = getRoom()
    const startTimer = settings.get("timer")
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
    const remainingPlayers = Array.from(users).filter(([key, value]) =>
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
    timer.reset()
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
      timer: setProp(room, "timer", ""),
      currentPlayer: setProp(room, "currentPlayer", ""),
      running: setProp(room, "running", false),
      winner: setProp(room, "winner", null),
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
    const _timer = data?.timer || 10
    const _lives = data?.lives || 2

    const { settings, room } = getRoom()
    room.set("timer", Number(_timer))
    settings.set("timer", Number(_timer))
    settings.set("lives", _lives)
    data && relayRoom()
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
