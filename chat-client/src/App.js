import React, { useContext, useEffect, useState } from "react"
import io from "socket.io-client"

import "./App.css"
import {
  BrowserRouter,
  Link,
  Outlet,
  Route,
  Routes,
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

const randomName = getRandomName()

function Header() {
  const { socket } = useSocket()
  const [name, setName] = useLocalStorage("name", randomName)
  const [id] = useLocalStorage("userId")
  const editName = () => {
    const newName = window.prompt("name:") || ""
    if (newName.trim()) {
      setName(newName)
      socket.emit("updateName", newName, id)
    }
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
          <Route path=":roomId" element={<InitializeSocket />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

const Home = () => {
  return <Link to={getRoomId()}>Create room</Link>
}

const SocketContext = React.createContext()
export const useSocket = () => useContext(SocketContext)

const InitializeSocket = () => {
  const { roomId } = useParams()
  const [socket, setSocket] = useState(undefined)
  const [name] = useLocalStorage("name", randomName)
  const [userId] = useLocalStorage("userId")
  const hasSocket = socket?.id

  useEffect(() => {
    if (!hasSocket) {
      const logger = (event, ...args) => {
        console.log(
          "%c" + event,
          "color: yellow;",
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

  const submitForm = (e) => {
    e.preventDefault()
    var formData = new FormData(e.target)
    const lives = formData.get("lives")
    const timer = formData.get("timer")
    const data = { lives, timer }
    socket.emit("setSettings", JSON.stringify(data))
  }

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
              placeholder="timer"
              defaultValue={String(timer)}
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
              placeholder="lives"
              defaultValue={lives}
            />
          </label>
        </div>
        <button type="submit">change settings</button>
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
    socket.emit("checkWord", value)
    e.target.reset()
  }

  const debounced = useDebouncedCallback((value) => {
    const val = value.trim().toLowerCase()
    setValue(val)
    socket.emit("setPlayerText", val)
  }, 30)

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
