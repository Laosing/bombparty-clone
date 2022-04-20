const { nanoid } = require("nanoid")
const serialize = require("serialize-javascript")
const Timer = require("easytimer.js").Timer

const dictionary = require("./data/words_dictionary.json")

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

  const initialTimer = 10
  const initialLives = 2

  socket.join(roomId)

  getRoom()
  // handleMessage("joined the room!")

  initializeUser()

  socket.on("checkWord", (value) => checkWord(value))
  socket.on("setPlayerText", (value) => setPlayerText(value))
  socket.on("startGame", () => startGame())
  socket.on("stopGame", () => stopGame())
  socket.on("switchPlayer", () => switchPlayer())
  socket.on("getRoom", () => relayRoom())
  socket.on("message", (value) => handleMessage(value))
  socket.on("disconnect", (reason) => disconnect(reason))
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`)
  })

  function relayRoom() {
    const { roomId, room } = getRoom()
    io.sockets.in(roomId).emit("getRoom", serialize(room))
  }

  function checkWord(value) {
    const { room, letterBlend, words } = getRoom()

    const isBlend = value.includes(letterBlend)
    const isDictionary = dictionary[value]
    const isUnique = !words.has(value)

    if (isBlend && isDictionary && isUnique) {
      words.add(value)
      room.set("letterBlend", getRandomCluster())
      timer.reset()
      switchPlayer()
    } else {
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
    const lives = player.lives > 0 ? player.lives - 1 : 0
    users.set(currentPlayer, { ...player, lives })
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
    const { room } = getRoom()
    room.set("running", true)
    room.set("letterBlend", getRandomCluster())
    room.set("words", new Set())
    resetUserLives()
    switchPlayer()

    timer.on("started", updateTimer)
    timer.on("reset", updateTimer)
    timer.on("secondsUpdated", updateSecondsTimer)

    timer.start({ startValues: { seconds: initialTimer } })
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
    timer.pause()
    timer.removeAllEventListeners()
    room.set("winner", player)
    room.set("running", false)
    room.set("currentPlayer", "")
    room.set("letterBlend", "")
    room.set("timer", "")
    resetUserText()
    relayRoom()
  }

  function resetUserLives() {
    const { room, users } = getRoom()
    const newUsers = Array.from(users, ([key, value]) => {
      return [key, { ...value, lives: initialLives }]
    })
    room.set("users", new Map(newUsers))
  }

  function resetUserText() {
    const { room, users } = getRoom()
    const newUsers = Array.from(users, ([key, value]) => {
      return [key, { ...value, text: "" }]
    })
    room.set("users", new Map(newUsers))
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
      winner: setProp(room, "winner", null)
    }

    return { room, roomId, ...props }
  }

  function initializeUser() {
    const { name, userId } = socket.handshake.auth
    const { users } = getRoom()
    users.set(userId, { id: userId, name })
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
  io.on("connection", async (socket) => {
    connection(io, socket)
  })
}

module.exports = chat

const getRandomCluster = () => cluster[(cluster.length * Math.random()) | 0]

const cluster = [
  "bl",
  "br",
  "cl",
  "cr",
  "dr",
  "fr",
  "tr",
  "fl",
  "gl",
  "gr",
  "pl",
  "pr",
  "sl",
  "sm",
  "sp",
  "st",
  "ab",
  "au",
  "ch",
  "ci",
  "cia",
  "ck",
  "ct",
  "dge",
  "dis",
  "dw",
  "ed",
  "ex",
  "ft",
  "ful",
  "gh",
  "in",
  "ing",
  "iou",
  "kn",
  "ld",
  "le",
  "lf",
  "lk",
  "lm",
  "lp",
  "lt",
  "ly",
  "men",
  "mis",
  "mp",
  "nce",
  "nch",
  "nd",
  "ng",
  "nk",
  "nse",
  "nt",
  "ou",
  "ov",
  "ph",
  "psy",
  "pt",
  "re",
  "sc",
  "sh",
  "shr",
  "sk",
  "sn",
  "spr",
  "str",
  "sw",
  "tch",
  "th",
  "thr",
  "tie",
  "ti",
  "tur",
  "tw",
  "un",
  "wh",
  "wr"
]
