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

const getRoomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)

const getRandomName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2
  })

// const name = prompt("name?") || randomName
// const name = randomName

function App() {
  const [name] = useLocalStorage("name", getRandomName())
  useLocalStorage("userId", nanoid())

  return (
    <div className="App">
      <header className="app-header">Current user: {name}</header>
      <Outlet />
    </div>
  )
}

const Router = () => {
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

const getSocketPath = () => {
  const port =
    process.env.NODE_ENV === "development"
      ? Number(process.env.PORT || 8080)
      : ""
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = window.location.hostname
  const socketPath = `${protocol}//${host}${port ? ":" + port : ""}`
  return socketPath
}

const InitializeSocket = () => {
  const { roomId } = useParams()
  const [socket, setSocket] = useState(undefined)
  const [name] = useLocalStorage("name")
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

      const newSocket = io({
        auth: { name, userId },
        query: { roomId }
      })
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
      <Link to="/">Leave room</Link> Current room: {roomId}
      <div className="chat-container">
        <Messages />
        <MessageInput />
        <Game />
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
      <div style={{ marginTop: "5rem" }}>
        <button onClick={toggleGame}>{running ? "stop" : "start"}</button>
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
  // console.log()
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
  }, 40)

  return (
    <>
      {currentPlayer && (
        <form onSubmit={submitForm}>
          <input
            autoFocus
            placeholder="Type your message"
            onChange={(e) => debounced(e.target.value)}
          />
        </form>
      )}
    </>
  )
}

// function Room

function Players() {
  const { room } = useRoom()
  const players = room.get("users")
  const running = room.get("running")
  const currentPlayer = room.get("currentPlayer")

  return (
    <div>
      <h5>Players</h5>
      {Array.from(players).map(([key, value]) => (
        <div key={key}>
          <span
            style={{
              display: "inline-block",
              marginRight: "1rem",
              fontWeight: key === currentPlayer ? "bold" : "initial"
            }}
          >
            {value?.name} {running ? value?.lives : ""}
          </span>
          <span>{value?.text}</span>
        </div>
      ))}
    </div>
  )
}

export default Router
