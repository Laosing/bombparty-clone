import React, { useContext, useEffect, useState } from "react"
import io from "socket.io-client"

import "./App.css"
import {
  BrowserRouter,
  Link,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams
} from "react-router-dom"

import {
  uniqueNamesGenerator,
  adjectives,
  animals
} from "unique-names-generator"
import { customAlphabet, nanoid } from "nanoid"

import { deserialize } from "functions/deserialize"
import { useLocalStorage } from "functions/hooks"
import { useDebouncedCallback } from "use-debounce"
import { MessagesWrapper } from "components/Messages"

const isDevEnv = process.env.NODE_ENV === "development"

const getRoomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)

const getRandomName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2
  })

function Header() {
  const { socket } = useSocket()
  const [name, setName] = useLocalStorage("name")
  const [id] = useLocalStorage("userId")
  const editName = () => {
    const newName =
      window
        .prompt("name: (leaving this blank will generate a random name)")
        .trim() || getRandomName()
    setName(newName)
    socket.emit("updateName", newName, id)
  }

  return (
    <div>
      <span>Current user: {name}</span>{" "}
      <button onClick={editName}>change name</button>
    </div>
  )
}

function App() {
  return (
    <div>
      <Outlet />
    </div>
  )
}

const Router = () => {
  useLocalStorage("userId", nanoid())

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path=":roomId" element={<ValidateRoom />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const onSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const room = formData.get("room")
    navigate(room)
  }

  return (
    <>
      <Link to={getRoomId()}>Create room</Link>
      <form onSubmit={onSubmit}>
        <label>
          join room
          <input name="room"></input>
          <button>submit</button>
        </label>
      </form>
    </>
  )
}

function ValidateRoom() {
  const { roomId } = useParams()
  const validRoomId = roomId.match(/^[A-Z]*$/) && roomId.length === 4

  if (!validRoomId) {
    return (
      <>
        Room not valid <Link to="/">back to home</Link>
      </>
    )
  }

  return <InitializeSocket />
}

const SocketContext = React.createContext()
export const useSocket = () => useContext(SocketContext)

const InitializeSocket = () => {
  const { roomId } = useParams()
  const [socket, setSocket] = useState(undefined)
  const [name] = useLocalStorage("name", getRandomName())
  const [userId] = useLocalStorage("userId")
  const hasSocket = socket?.id

  useEffect(() => {
    if (!hasSocket) {
      const logger = (event, ...args) => {
        console.log(
          "%c" + event,
          "color: pink;",
          event === "getRoom" ? deserialize(args) : args
        )
      }

      const params = { auth: { name, userId }, query: { roomId } }
      const props = isDevEnv
        ? [`http://${window.location.hostname}:8080`, params]
        : [params]

      const newSocket = io(...props)
      setSocket(newSocket)
      console.log("setting socket!", newSocket)

      newSocket.onAny(logger)
      return () => {
        newSocket.offAny(logger)
        newSocket.close()
      }
    }
  }, [name, roomId, setSocket, hasSocket, userId])

  if (!socket) {
    return <>Not Connected</>
  }

  return (
    <SocketContext.Provider value={{ socket, userId }}>
      <InitializeRoom />
    </SocketContext.Provider>
  )
}

const RoomContext = React.createContext()
export const useRoom = () => React.useContext(RoomContext)

function InitializeRoom() {
  const { socket, userId } = useSocket()
  const { roomId } = useParams()
  const [room, setRoom] = useState()

  useEffect(() => {
    const getRoom = (val) => setRoom(deserialize(val))

    socket.emit("getRoom")
    socket.on("getRoom", getRoom)
    return () => {
      socket.off("getRoom", getRoom)
    }
  }, [socket])

  if (!room) {
    return <>initializing room</>
  }

  if (!room.get("users").has(userId)) {
    return <>disconnected!</>
  }

  return (
    <RoomContext.Provider value={{ room, roomId }}>
      <Room />
    </RoomContext.Provider>
  )
}

function Room() {
  const { roomId } = useRoom()

  return (
    <div>
      <div style={{ marginBottom: "5rem" }}>
        <Header />
        <Link to="/">Leave room</Link> Current room: {roomId}
        <GameSettings />
      </div>
      <div style={{ marginBottom: "5rem" }}>
        <Game />
      </div>
      <div>
        <MessagesWrapper />
      </div>
    </div>
  )
}

function GameSettings() {
  const { socket } = useSocket()
  const { room } = useRoom()

  const running = room.get("running")
  const settings = room.get("settings")
  const lives = settings.get("lives")
  const timer = settings.get("timer")
  const letterBlendCounter = settings.get("letterBlendCounter")

  const submitForm = (e) => {
    e.preventDefault()
    var formData = new FormData(e.target)
    const lives = formData.get("lives")
    const timer = formData.get("timer")
    const letterBlendCounter = formData.get("letterBlendCounter")
    const data = { lives, timer, letterBlendCounter }
    socket.emit("setSettings", JSON.stringify(data))
  }

  const [notification, setNotification] = useState(false)

  useEffect(() => {
    const triggerValidation = (val) => {
      setNotification(val)
      setTimeout(() => setNotification(false), 200)
    }

    socket.on("setSettings", triggerValidation)
    return () => {
      socket.off("setSettings", triggerValidation)
    }
  }, [socket])

  if (running) {
    return null
  }

  return (
    <>
      <form onSubmit={submitForm}>
        <div>
          <label>
            timer
            <input
              key={String(timer)}
              type="number"
              name="timer"
              defaultValue={String(timer)}
              min="1"
              step="1"
            />
          </label>
        </div>
        <div>
          <label>
            lives
            <input
              key={lives}
              type="number"
              name="lives"
              defaultValue={lives}
              min="1"
              step="1"
            />
          </label>
        </div>
        <div>
          <label>
            change letters after attempts
            <input
              key={letterBlendCounter}
              type="number"
              name="letterBlendCounter"
              defaultValue={letterBlendCounter}
              min="1"
              step="1"
            />
          </label>
        </div>
        <button type="submit">change settings</button>
        {notification && "updated!"}
      </form>
    </>
  )
}

function Game() {
  const { socket } = useSocket()
  const { room } = useRoom()

  const letterBlend = room.get("letterBlend")
  const timer = room.get("timer")
  const running = room.get("running")
  const winner = room.get("winner")

  const toggleGame = () => {
    if (running) {
      console.log("STOP!")
      socket.emit("stopGame")
    } else {
      console.log("START!")
      socket.emit("startGame")
    }
  }

  return (
    <>
      <div>
        <button onClick={toggleGame} style={{ marginBottom: "3rem" }}>
          {running ? "stop" : "start"}
        </button>
        {running && (
          <>
            <div>{letterBlend?.toUpperCase()}</div>
            <PlayerInput />
            <div>{timer}</div>
          </>
        )}
        {!running && winner && <Winner winner={winner} />}
      </div>
      <Players />
    </>
  )
}

function Winner({ winner }) {
  return (
    <h3>
      Winner! <div>{winner.name}</div>
    </h3>
  )
}

function PlayerInput() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()
  const [value, setValue] = useState("")

  const currentPlayer = room.get("currentPlayer") === userId

  const submitForm = (e) => {
    e.preventDefault()
    socket.emit("checkWord", value, userId)
    e.target.reset()
  }

  const debounced = useDebouncedCallback((value) => {
    const val = value.trim().toLowerCase()
    setValue(val)
    socket.emit("setPlayerText", val, userId)
  }, 40)

  return (
    <>
      {currentPlayer && (
        <form onSubmit={submitForm}>
          <input autoFocus onChange={(e) => debounced(e.target.value)} />
        </form>
      )}
    </>
  )
}

function Players() {
  const { socket } = useSocket()
  const { room } = useRoom()
  const players = room.get("users")
  const running = room.get("running")
  const currentPlayer = room.get("currentPlayer")

  const [validation, setValidation] = useState("")

  useEffect(() => {
    const triggerValidation = (val) => {
      setValidation(val)
      setTimeout(() => setValidation(""), 200)
    }

    socket.on("wordValidation", triggerValidation)
    return () => {
      socket.off("wordValidation", triggerValidation)
    }
  }, [socket])

  const color =
    validation === "invalid"
      ? "red"
      : validation === "valid"
      ? "green"
      : "initial"

  return (
    <div>
      <h5>Players</h5>
      {Array.from(players).map(([key, value]) => (
        <div key={key}>
          <span
            style={{
              color: key === currentPlayer ? color : "initial",
              display: "inline-block",
              marginRight: "1rem",
              fontWeight: key === currentPlayer ? "bold" : "initial"
            }}
          >
            {value?.name}{" "}
            <span style={{ color: "red" }}>
              {running ? new Array(Number(value?.lives)).fill("❤") : ""}
            </span>
          </span>
          <span>{value?.text}</span>
        </div>
      ))}
    </div>
  )
}

export default Router
