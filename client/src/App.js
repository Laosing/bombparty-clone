import React, { useContext, useEffect, useState } from "react"
import io from "socket.io-client"

import "./App.scss"
import "animate.css"

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
// import { useLocalStorage } from "functions/hooks"
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
import clsx from "clsx"

import soundBoom from "audio/boom.mp3"
import soundLobby from "audio/lobby-2.m4a"
import soundValid from "audio/valid.mp3"
import soundInvalid from "audio/error.mp3"
import soundJoining from "audio/joining.mp3"
import soundWinner from "audio/winner.mp3"

import create from "zustand"
import { persist } from "zustand/middleware"
import shallow from "zustand/shallow"
import { Howl } from "howler"
import { createAvatar } from "@dicebear/avatars"
import * as avatarStyle from "@dicebear/big-smile"

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
        <Navbar.Brand className="m-auto">💥💣 Bombparty 💣💥</Navbar.Brand>
        {children}
      </Container>
    </Navbar>
  )
}

const useSoundStore = create(
  persist(
    (set, get) => ({
      music: true,
      toggleMusic: () => set({ music: !get().music }),
      soundEffects: true,
      toggleSoundEffects: () => set({ soundEffects: !get().soundEffects })
    }),
    { name: "sound-settings" }
  )
)

const useGameStore = create(
  persist(
    (set) => ({
      name: getRandomName(),
      setName: (name) => set({ name }),
      userId: nanoid()
    }),
    { name: "game-settings" }
  )
)

function HeaderUser() {
  const { socket } = useSocket()

  const [name, setName, userId] = useGameStore(
    (state) => [state.name, state.setName, state.userId],
    shallow
  )
  // const [name, setName] = useLocalStorage("name")
  // const [id] = useLocalStorage("userId")

  const editName = () => {
    const namePrompt = window.prompt(
      "name: (leaving this blank will generate a random name)"
    )
    if (namePrompt !== null) {
      const newName = namePrompt ? namePrompt.trim() : getRandomName()
      setName(newName)
      socket.emit("updateName", newName, userId)
    }
  }

  return (
    <div className="h5 mb-0 d-flex justify-content-center align-items-center">
      <div className="position-relative">
        {name}
        <Button
          style={{ transform: "translate(0, -50%)" }}
          className="text-decoration-none position-absolute top-50 start-100"
          onClick={editName}
          size="sm"
          variant="link"
        >
          ✏️
        </Button>
      </div>
    </div>
  )
}

function AvatarSettings() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const users = room.get("users")
  const currentPlayer = users.get(userId)

  const editAvatar = () => {
    socket.emit("updateAvatar", userId)
  }

  return (
    <div className="d-flex justify-content-center align-items-center ">
      <div className="position-relative">
        <Avatar style={{ width: "75px" }} id={currentPlayer.avatar} />
        <Button
          style={{ transform: "translate(70%, 0)" }}
          className="text-decoration-none border-0 position-absolute bottom-0 end-0"
          onClick={editAvatar}
          size="sm"
          variant="link"
        >
          ✒️
        </Button>
      </div>
    </div>
  )
}

function App() {
  return <Outlet />
}

const Router = () => {
  // useLocalStorage("userId", nanoid())

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
  return <Container className="my-5 text-center">{children}</Container>
}

const Home = () => {
  const navigate = useNavigate()
  const onSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const room = formData.get("room").toUpperCase()
    navigate(room)
  }

  return (
    <LayoutWithHeader>
      <h1 className="display-3">Welcome to 💣party!</h1>
      <p className="mb-5">Create or join a room to get started</p>
      <Button as={Link} to={getRoomId()} className="mb-4">
        Create room
      </Button>
      <Form
        onSubmit={onSubmit}
        style={{ maxWidth: "500px" }}
        className="m-auto"
      >
        <InputGroup className="mb-3">
          <InputGroup.Text>Room ID</InputGroup.Text>
          <FormControl name="room" style={{ textTransform: "uppercase" }} />
          <Button type="submit" variant="outline-secondary">
            Join
          </Button>
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
  const name = useGameStore((state) => state.name)
  const userId = useGameStore((state) => state.userId)
  // const [name] = useLocalStorage("name", getRandomName())
  // const [userId] = useLocalStorage("userId")
  const hasSocket = socket?.id

  console.log({ hasSocket })

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
        console.log("closing!")
        newSocket.offAny(logger)
        newSocket.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  console.log("room?")

  return (
    <>
      <Header>{/* <HeaderUser /> */}</Header>
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
            <div className="p-3 pb-0 text-center">
              <AvatarSettings />
              <HeaderUser />
            </div>
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
            <AudioSettings />
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

function AudioSettings() {
  const [music, toggleMusic] = useSoundStore((store) => [
    store.music,
    store.toggleMusic
  ])
  const [soundEffects, toggleSoundEffects] = useSoundStore((store) => [
    store.soundEffects,
    store.toggleSoundEffects
  ])

  return (
    <Form className="p-3">
      <Form.Check
        type="switch"
        checked={!!music}
        onChange={toggleMusic}
        label="Music"
      />
      <Form.Check
        type="switch"
        checked={!!soundEffects}
        onChange={toggleSoundEffects}
        label="Sound effects"
      />
    </Form>
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
          as={"span"}
          size="sm"
          key={letter}
          variant={userLetters.includes(letter) ? "dark" : "outline-dark"}
          className={`disabled me-1 mb-1`}
        >
          {letter.toUpperCase()}
        </Button>
      ))}
      <div className="small">Use all the letters to gain a heart</div>
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
                max="60"
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

const Avatar = ({ id, ...props }) => {
  const avatar = React.useMemo(
    () => createAvatar(avatarStyle, { seed: id }),
    [id]
  )

  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar)}`}
      alt=""
      {...props}
    />
  )
}

function Game() {
  const { socket } = useSocket()
  const { room } = useRoom()

  const letterBlend = room.get("letterBlend")
  const timer = room.get("timer")
  const running = room.get("running")
  const winner = room.get("winner")

  const [lobbyMusic] = useHowl(soundLobby, "music", {
    loop: true,
    autoplay: true
  })

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
    if (running) {
      lobbyMusic.stop()
    } else {
      const sound = lobbyMusic.play()
      lobbyMusic.fade(0, 1, 2000, sound)
    }
  }, [running, lobbyMusic])

  return (
    <>
      <div className="mb-4">
        <Button
          variant={running ? "danger" : "primary"}
          onClick={toggleGame}
          className="mb-5"
          size="lg"
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
      Winner!
      <div className="mt-2 display-3 animate__animated animate__bounceIn">
        <Avatar
          style={{ width: "3em", marginBottom: "-.25em" }}
          id={winner.avatar}
        />
        <div>{winner.name}</div>
      </div>
    </h3>
  )
}

function useWordValidation(timeout = 300, callback) {
  const [validation, setValidation] = useState({})
  const { socket } = useSocket()

  useEffect(() => {
    const triggerValidation = (isValid, data) => {
      setValidation({ isValid, ...JSON.parse(data) })
      typeof callback === "function" && callback(isValid)
      setTimeout(() => setValidation({}), timeout)
    }

    socket.on("wordValidation", triggerValidation)
    return () => {
      socket.off("wordValidation", triggerValidation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, timeout])

  return validation
}

function PlayerInput() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const [value, setValue] = useState("")

  const validation = useWordValidation()

  const users = room.get("users")
  const currentPlayer = room.get("currentPlayer")
  const isCurrentPlayer = currentPlayer === userId
  const currentRoomPlayer = users.get(currentPlayer)

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

  const color =
    validation.isValid === false
      ? "animate__animated animate__shakeX animate__faster border-danger"
      : validation.isValid
      ? "border-success"
      : "initial"

  const errorReason =
    validation.isUnique === false
      ? "Already used!"
      : validation.isDictionary === false
      ? "Not in my dictionary!"
      : " "

  return (
    <>
      <Form
        onSubmit={submitForm}
        className="d-flex justify-content-center my-3 flex-column m-auto"
        style={{ maxWidth: "20em" }}
      >
        <Form.Control
          className={clsx(color)}
          key={isCurrentPlayer}
          autoFocus
          onChange={(e) => debounced(e.target.value)}
          disabled={!isCurrentPlayer}
          {...(!isCurrentPlayer && { value: currentRoomPlayer.text })}
        />
        <Form.Text className="text-danger">{errorReason}</Form.Text>
      </Form>
    </>
  )
}

const useHowl = (src, type = "effect", props) => {
  const [soundMusicSettings, soundEffectSettings] = useSoundStore((state) => [
    state.music,
    state.soundEffects
  ])

  const json = JSON.stringify({ src, ...props })
  const sound = React.useMemo(() => {
    return new Howl(JSON.parse(json))
  }, [json])

  useEffect(() => {
    return () => sound.unload()
  }, [sound])

  if (type === "music") setTimeout(() => sound.mute(!soundMusicSettings), 0)
  if (type === "effect") setTimeout(() => sound.mute(!soundEffectSettings), 0)

  return [sound]
}

function Players() {
  const { socket } = useSocket()
  const { room } = useRoom()
  const players = room.get("users")
  const running = room.get("running")
  const currentPlayer = room.get("currentPlayer")

  const [validControls] = useHowl(soundValid)
  const [invalidControls] = useHowl(soundInvalid)
  const [boomControls] = useHowl(soundBoom)
  const [winnerControls] = useHowl(soundWinner)
  const [userJoinedControls] = useHowl(soundJoining)

  const validation = useWordValidation(null, (isValid) => {
    if (isValid) {
      validControls.play()
    } else {
      invalidControls.play()
    }
  })

  useEffect(() => {
    const triggerBoom = () => boomControls.play()
    const triggerUserJoined = () => userJoinedControls.play()
    const triggerWinner = () => winnerControls.play()

    socket.on("userJoined", triggerUserJoined)
    socket.on("winner", triggerWinner)
    socket.on("boom", triggerBoom)
    return () => {
      socket.off("boom", triggerBoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket])

  const textColor =
    validation.isValid === false
      ? "text-danger"
      : validation.isValid
      ? "text-success"
      : false

  return (
    <div>
      <h5>Players</h5>
      <ListGroup style={{ maxWidth: "30em" }} className="m-auto">
        {Array.from(players).map(([id, value]) => (
          <Stack
            direction="horizontal"
            gap={2}
            key={id}
            className={clsx(
              "position-relative",
              "list-group-item",
              running &&
                value.lives === 0 &&
                "list-group-item-secondary text-decoration-line-through",
              id === currentPlayer && "list-group-item-primary"
            )}
          >
            <span
              className="position-absolute top-50 start-0"
              style={{ width: "35px", transform: `translate(-120%, -50%)` }}
            >
              {!running && <Avatar id={value.avatar} />}
              {running &&
                (value.lives > 0 ? <Avatar id={value.avatar} /> : "💀")}
            </span>

            <span
              className={clsx(
                id === currentPlayer && "fw-bold",
                id === validation.currentPlayer && textColor
              )}
            >
              {id === currentPlayer && (
                <span className="position-absolute top-50 start-0 translate-middle">
                  💣
                </span>
              )}

              {value?.name}
            </span>
            <span className="text-danger">
              {running ? new Array(Number(value?.lives)).fill("❤") : ""}
            </span>
            {running && id !== currentPlayer && (
              <span className="ms-auto small">{value?.text}</span>
            )}
          </Stack>
        ))}
      </ListGroup>
    </div>
  )
}

export default Router
