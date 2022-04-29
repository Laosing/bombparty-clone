import React, { useContext, useEffect, useState } from "react"
import io from "socket.io-client"

import "./App.scss"
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

import {
  Navbar,
  Container,
  Button,
  Form,
  InputGroup,
  FormControl,
  Row,
  Col,
  Stack,
  ListGroup
} from "react-bootstrap"
import { createGlobalState, useAudio } from "react-use"
import clsx from "clsx"

import soundBoom from "audio/boom.mp3"
import soundLobby from "audio/lobby-2.m4a"
import soundValid from "audio/valid.mp3"
import soundInvalid from "audio/error.mp3"
import soundJoining from "audio/joining.mp3"
import soundWinner from "audio/winner.mp3"

const isDevEnv = process.env.NODE_ENV === "development"

const getRoomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)

const getRandomName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2
  })

function Header({ children }) {
  return (
    <Navbar bg="dark" variant="dark">
      <Container fluid>
        <Navbar.Brand>💣 Bombparty-clone</Navbar.Brand>
        {children}
      </Container>
    </Navbar>
  )
}

const useSound = createGlobalState(true)

function HeaderUser() {
  const { socket } = useSocket()
  const [name, setName] = useLocalStorage("name")
  const [id] = useLocalStorage("userId")
  const [sound, setSound] = useSound()

  const editName = () => {
    const namePrompt = window.prompt(
      "name: (leaving this blank will generate a random name)"
    )
    if (namePrompt !== null) {
      const newName = namePrompt ? namePrompt.trim() : getRandomName()
      setName(newName)
      socket.emit("updateName", newName, id)
    }
  }

  const toggleSound = () => setSound(!sound)

  return (
    <Navbar.Text className="d-flex align-items-center p-0">
      Signed in as: <span className="text-white me-2 ms-1">{name}</span>
      <Stack direction="horizontal" gap={2}>
        <Button onClick={editName} size="sm" variant="outline-light">
          ✏️
        </Button>
        <Button
          onClick={toggleSound}
          size="sm"
          variant={sound ? "light" : "outline-light"}
        >
          🎵
        </Button>
      </Stack>
    </Navbar.Text>
  )
}

function App() {
  return <Outlet />
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

const LayoutWithHeader = ({ children }) => (
  <>
    <Header />
    <Layout>{children}</Layout>
  </>
)

const Layout = ({ children }) => {
  return <Container className="mt-5 text-center">{children}</Container>
}

const Home = () => {
  const navigate = useNavigate()
  const onSubmit = (e) => {
    console.log(e)
    e.preventDefault()
    const formData = new FormData(e.target)
    const room = formData.get("room").toUpperCase()
    navigate(room)
  }

  return (
    <LayoutWithHeader>
      <Button as={Link} to={getRoomId()} className="mb-3">
        Create room
      </Button>
      <Form
        onSubmit={onSubmit}
        style={{ maxWidth: "500px" }}
        className="m-auto"
      >
        <InputGroup className="mb-3">
          <InputGroup.Text>Join room</InputGroup.Text>
          <FormControl name="room" style={{ textTransform: "uppercase" }} />
          <Button type="submit">Join</Button>
        </InputGroup>
      </Form>
    </LayoutWithHeader>
  )
}

function ValidateRoom() {
  const { roomId } = useParams()
  const validRoomId = roomId.match(/^[A-Z]*$/) && roomId.length === 4

  if (!validRoomId) {
    return (
      <LayoutWithHeader>
        <h1 className="h3 mb-3">Invalid room</h1>
        <Button as={Link} to="/">
          Back to home
        </Button>
      </LayoutWithHeader>
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
    return (
      <LayoutWithHeader>
        <h1 className="h3">Not Connected, try refreshing</h1>
      </LayoutWithHeader>
    )
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
    return (
      <LayoutWithHeader>
        <h1 className="h3">initializing room</h1>
      </LayoutWithHeader>
    )
  }

  if (!room.get("users").has(userId)) {
    return (
      <LayoutWithHeader>
        <h1 className="h3">Disconnected!</h1>
      </LayoutWithHeader>
    )
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
    <>
      <Header>
        <HeaderUser />
      </Header>
      <Container fluid className="d-flex flex-grow-1">
        <Row className="flex-grow-1">
          <Col md={8}>
            <Layout>
              <Game />
            </Layout>
          </Col>
          <Col
            md={4}
            className="p-0 d-flex flex-column"
            style={{ background: "var(--bs-gray-200)" }}
          >
            <ListGroup className="p-3">
              <ListGroup.Item className="d-flex justify-content-between align-items-center p-2">
                <span>
                  Current room: <strong>{roomId}</strong>
                </span>
                <Button as={Link} to="/" size="sm" variant="danger">
                  Leave room
                </Button>
              </ListGroup.Item>
            </ListGroup>
            <hr className="m-0" />
            <GameSettings />
            <hr className="m-0" />
            <MessagesWrapper />
          </Col>
        </Row>
      </Container>
    </>
  )
}

function HeartLetters() {
  const { userId } = useSocket()
  const { room } = useRoom()

  const running = room.get("running")
  const userLetters = [...room.get("users").get(userId).letters]
  const letters = "abcdefghijklmnopqrstuvwxyz"

  if (!running) {
    return null
  }

  return (
    <>
      {[...letters].map((letter) => (
        <Button
          size="sm"
          disabled
          key={letter}
          variant={userLetters.includes(letter) ? "dark" : "outline-dark"}
          className={`me-1 mb-1`}
        >
          {letter.toUpperCase()}
        </Button>
      ))}
    </>
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
      setTimeout(() => setNotification(false), 500)
    }

    socket.on("setSettings", triggerValidation)
    return () => {
      socket.off("setSettings", triggerValidation)
    }
  }, [socket])

  return (
    <>
      <Form onSubmit={submitForm} className="p-3">
        <Row>
          <Stack gap={3}>
            <Form.Group controlId="timer">
              <Form.Label>Timer</Form.Label>
              <Form.Control
                key={String(timer)}
                type="number"
                name="timer"
                defaultValue={String(timer)}
                min="1"
                step="1"
                disabled={running}
              />
            </Form.Group>
            <Form.Group controlId="lives">
              <Form.Label>Lives</Form.Label>
              <Form.Control
                key={lives}
                type="number"
                name="lives"
                defaultValue={lives}
                min="1"
                step="1"
                disabled={running}
              />
            </Form.Group>
            <Form.Group controlId="letterBlendCounter">
              <Form.Label>Change letters after # turns</Form.Label>
              <Form.Control
                key={letterBlendCounter}
                type="number"
                name="letterBlendCounter"
                defaultValue={letterBlendCounter}
                min="1"
                step="1"
                disabled={running}
              />
            </Form.Group>
            <div className="d-flex align-items-end">
              <Button
                type="submit"
                variant={notification ? "success" : "secondary"}
                className="w-100"
                disabled={running}
              >
                {notification ? "Updated!" : "Change settings"}
              </Button>
            </div>
          </Stack>
        </Row>
      </Form>
    </>
  )
}

function Game() {
  const { socket } = useSocket()
  const { room } = useRoom()
  const [sound] = useSound()

  const [audioLobby, , lobbyControls] = useAudio({
    src: soundLobby,
    autoPlay: true,
    preload: "auto",
    loop: true
  })

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

  useEffect(() => {
    if (sound) {
      lobbyControls.play()
    } else {
      lobbyControls.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound])

  return (
    <>
      {audioLobby}
      <div className="mb-4">
        <Button
          variant={running ? "danger" : "primary"}
          onClick={toggleGame}
          className="mb-5"
        >
          {running ? "Stop" : "Start Game"}
        </Button>
        <div>
          <HeartLetters />
        </div>
        {running && (
          <div className="my-5">
            <div className="h1">{letterBlend?.toUpperCase()}</div>
            <PlayerInput />
            <div className="h3">{timer}</div>
          </div>
        )}
        {!running && winner && <Winner winner={winner} />}
      </div>
      <Players />
    </>
  )
}

function Winner({ winner }) {
  return (
    <h3 className="mb-5">
      Winner! <div className="display-3">{winner.name}</div>
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
  }, 30)

  return (
    <>
      <Form
        onSubmit={submitForm}
        className="d-flex justify-content-center my-3 flex-column m-auto"
        style={{ maxWidth: "20em" }}
      >
        <Form.Control
          key={currentPlayer}
          autoFocus
          onChange={(e) => debounced(e.target.value)}
          disabled={!currentPlayer}
        />
      </Form>
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

  const [validAudio, , validControls] = useAudio({
    src: soundValid,
    preload: "auto"
  })
  const [invalidAudio, , invalidControls] = useAudio({
    src: soundInvalid,
    preload: "auto"
  })
  const [boomAudio, , boomControls] = useAudio({
    src: soundBoom,
    preload: "auto"
  })
  const [winnerAudio, , winnerControls] = useAudio({
    src: soundWinner,
    preload: "auto"
  })
  const [userJoinedAudio, , userJoinedControls] = useAudio({
    src: soundJoining,
    preload: "auto"
  })

  useEffect(() => {
    const triggerValidation = (val) => {
      setValidation(val)
      if (val === "valid") {
        validControls.play()
      } else {
        invalidControls.play()
      }
      setTimeout(() => setValidation(""), 200)
    }

    const triggerBoom = () => boomControls.play()
    const triggerUserJoined = () => userJoinedControls.play()
    const triggerWinner = () => winnerControls.play()

    socket.on("userJoined", triggerUserJoined)
    socket.on("winner", triggerWinner)
    socket.on("boom", triggerBoom)
    socket.on("wordValidation", triggerValidation)
    return () => {
      socket.off("boom", triggerBoom)
      socket.off("wordValidation", triggerValidation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

  const color =
    validation === "invalid"
      ? "text-danger"
      : validation === "valid"
      ? "text-success"
      : "initial"

  return (
    <div>
      {validAudio}
      {invalidAudio}
      {winnerAudio}
      {boomAudio}
      {userJoinedAudio}
      <h5>Players</h5>
      {Array.from(players).map(([key, value]) => (
        <Stack
          direction="horizontal"
          gap={2}
          key={key}
          className="justify-content-center"
        >
          <span
            className={clsx(key === currentPlayer ? "fw-bold" : "initial")}
            style={{
              color: key === currentPlayer ? color : "initial"
            }}
          >
            {key === currentPlayer ? "💣 " : ""} {value?.name}
          </span>
          <span className="text-danger">
            {running ? new Array(Number(value?.lives)).fill("❤") : ""}
          </span>
          {running && <span>{value?.text}</span>}
        </Stack>
      ))}
    </div>
  )
}

export default Router
