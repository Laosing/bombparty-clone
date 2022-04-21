import React, { useContext, useEffect, useState } from "react"
import io from "socket.io-client"
import Messages from "components/Messages"
import MessageInput from "components/MessageInput"

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

const isDevEnv = process.env.NODE_ENV === "development"

const getRoomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)

const getRandomName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2
  })

const randomName = getRandomName()
console.log({ randomName })

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
      <button onClick={editName}>Edit name</button>
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
      </div>
      <div style={{ marginBottom: "5rem" }}>
        <Game />
      </div>
      <div>
        <Messages />
        <MessageInput />
      </div>
    </div>
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
    if (value.length >= 3) {
      socket.emit("checkWord", value)
    }
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

  const [error, setError] = useState("")

  useEffect(() => {
    const triggerError = (val) => {
      setError(val)
      setTimeout(() => setError(""), 200)
    }

    socket.on("wordError", triggerError)
    return () => {
      socket.off("wordError", triggerError)
    }
  }, [socket])

  return (
    <div>
      <h5>Players</h5>
      {Array.from(players).map(([key, value]) => (
        <div key={key}>
          <span
            style={{
              color: key === currentPlayer && error ? "red" : "initial",
              display: "inline-block",
              marginRight: "1rem",
              fontWeight: key === currentPlayer ? "bold" : "initial"
            }}
          >
            {value?.name} {running ? new Array(value?.lives).fill("❤") : ""}
          </span>
          <span>{value?.text}</span>
        </div>
      ))}
    </div>
  )
}

export default Router
