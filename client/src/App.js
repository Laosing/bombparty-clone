import React, { useContext, useEffect, useState, useDeferredValue } from "react"
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
  ListGroup,
  Alert,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap"
import clsx from "clsx"

import soundBoom from "audio/boom.mp3"
import soundLobby from "audio/lobby-2.m4a"
import soundValid from "audio/valid.mp3"
import soundInvalid from "audio/error.mp3"
import soundJoining from "audio/joining.mp3"
import soundGainedHeart from "audio/gained-heart.mp3"
import soundWinner from "audio/winner.mp3"

import { ReactComponent as Bombsvg } from "images/bomb.svg"

import create from "zustand"
import { persist } from "zustand/middleware"
import shallow from "zustand/shallow"
import { Howl, Howler } from "howler"
import { createAvatar } from "@dicebear/avatars"
import * as avatarStyle from "@dicebear/big-smile"
import { useInterval } from "functions/hooks"
import { JellyTriangle } from "@uiball/loaders"
import confetti from "canvas-confetti"
import Highlighter from "react-highlight-words"

const isDevEnv = process.env.NODE_ENV === "development"

const getRoomId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4)

const getRandomName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2
  })

const useSoundStore = create(
  persist(
    (set, get) => ({
      music: true,
      toggleMusic: () => set({ music: !get().music }),
      soundEffects: true,
      toggleSoundEffects: () => set({ soundEffects: !get().soundEffects }),
      volume: 0.5,
      setVolume: (val) => set({ volume: val })
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

const Highlight = (props) => (
  <Highlighter
    highlightTag="span"
    highlightClassName="text-danger"
    autoEscape={true}
    {...props}
  />
)

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

function HeaderUser() {
  const { socket } = useSocket()

  const [name, setName, userId] = useGameStore(
    (state) => [state.name, state.setName, state.userId],
    shallow
  )

  const editName = () => {
    const namePrompt = window.prompt(
      "Name: (over 30 characters or blank will generate a random name)"
    )
    if (namePrompt !== null) {
      const validName = namePrompt.trim().length < 30 && namePrompt.trim()
      const newName = validName ? namePrompt.trim() : getRandomName()
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

const LayoutWithHeader = ({ children, ...props }) => (
  <>
    <Header />
    <Layout {...props}>{children}</Layout>
  </>
)

const Layout = ({ children, className, ...props }) => {
  return (
    <Container className={clsx("my-5 text-center", className)} {...props}>
      {children}
    </Container>
  )
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
      <Button size="lg" as={Link} to={getRoomId()} className="mb-4">
        Create room
      </Button>
      <Form onSubmit={onSubmit} className="mb-5">
        <Form.Label>Know an existing room? Enter it here!</Form.Label>
        <InputGroup className="w-auto justify-content-center">
          <FormControl
            className="text-uppercase"
            name="room"
            style={{ maxWidth: "120px" }}
          />
          <Button type="submit" variant="outline-secondary">
            Join
          </Button>
        </InputGroup>
      </Form>
    </LayoutWithHeader>
  )
}

const Rules = ({ className }) => (
  <Alert style={{ maxWidth: "30em" }} className={clsx("mx-auto", className)}>
    <h5>🧐 Rules</h5>
    <p className="mx-auto small mb-0">
      On a player's turn they must type a word (more than 2 characters)
      containing the given letters in order before the bomb explodes (example:
      LU - BLUE). If a player does not type a word in time, they lose a life.
      The last player remaining wins the game.
    </p>
  </Alert>
)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoadingStuck = !room || !room.get("users").has(userId)
  useInterval(
    () => {
      if (isLoadingStuck) {
        window.location.reload()
      }
    },
    isLoadingStuck ? 5000 : null
  )

  if (!room) {
    return (
      <LayoutWithHeader className="d-flex align-items-center justify-content-center flex-column gap-3">
        <h1 className="h3">Initializing room</h1>
        <JellyTriangle size={60} speed={1} color="var(--bs-primary)" />
      </LayoutWithHeader>
    )
  }

  if (!room.get("users").has(userId)) {
    return (
      <LayoutWithHeader className="d-flex align-items-center justify-content-center flex-column gap-3">
        <h1 className="h3">Disconnected!</h1>
        <JellyTriangle size={60} speed={1} color="var(--bs-primary)" />
        <p>
          Hold on! We're trying to get you back on track. If this page is stuck
          try <Link to="/">rejoining a different room</Link>
        </p>
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
      <Header />
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
            <Hr />
            <AudioSettings />
            <Hr />
            <GameSettings />
            <Hr />
            <MessagesWrapper />
          </Col>
        </Row>
      </Container>
    </>
  )
}

const Hr = () => (
  <hr className="m-0" style={{ backgroundColor: "var(--bs-gray-600)" }} />
)

function AudioSettings() {
  const [
    music,
    toggleMusic,
    soundEffects,
    toggleSoundEffects,
    volume,
    setVolume
  ] = useSoundStore(
    (store) => [
      store.music,
      store.toggleMusic,
      store.soundEffects,
      store.toggleSoundEffects,
      store.volume,
      store.setVolume
    ],
    shallow
  )

  useEffect(() => {
    Howler.volume(volume)
  }, [volume])

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
      <Form.Label className="mt-2 mb-0">Volume</Form.Label>
      <Form.Range
        defaultValue={volume}
        min="0"
        max="1"
        step=".1"
        onChange={(e) => setVolume(e.target.value)}
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
    <div>
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
  const hardMode = settings.get("hardMode")

  const submitForm = (e) => {
    e.preventDefault()
    var formData = new FormData(e.target)
    const lives = formData.get("lives")
    const timer = formData.get("timer")
    const letterBlendCounter = formData.get("letterBlendCounter")
    const hardMode = formData.get("hardMode")
    const data = { lives, timer, letterBlendCounter, hardMode }
    socket.emit("setSettings", data)
  }

  const [notification, setNotification] = useState(false)

  const [timerValue, setTimerValue] = useState(timer)
  const [livesValue, setLivesValue] = useState(lives)
  const [lettersValue, setLettersValue] = useState(letterBlendCounter)
  const [hardModeValue, setHardModeValue] = useState(hardMode)

  useEffect(() => {
    const triggerValidation = (val) => {
      val = deserialize(val)
      setTimerValue(val.get("timer"))
      setLivesValue(val.get("lives"))
      setLettersValue(val.get("letterBlendCounter"))
      setNotification(Boolean(val))
      setTimeout(() => setNotification(false), 500)
    }

    socket.on("setSettings", triggerValidation)
    return () => {
      socket.off("setSettings", triggerValidation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Form onSubmit={submitForm} className="p-3">
        <Row>
          <Stack gap={2}>
            {/* <Form.Check
              type="switch"
              checked={!!true}
              onChange={() => {}}
              label="Show Timer"
            /> */}
            <Form.Group controlId="timer">
              <Form.Label className="mb-0">
                Timer: <strong>{timerValue}s</strong>
              </Form.Label>
              <Form.Range
                key={`form-timer-${timer}`}
                name="timer"
                defaultValue={String(timer)}
                min="1"
                max="59"
                step="1"
                disabled={running}
                onChange={(e) => setTimerValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="lives">
              <Form.Label className="mb-0">
                Lives: <strong>{livesValue}</strong>
              </Form.Label>
              <Form.Range
                key={`form-lives-${lives}`}
                type="number"
                name="lives"
                defaultValue={lives}
                min="1"
                max="10"
                step="1"
                disabled={running}
                onChange={(e) => setLivesValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="letterBlendCounter">
              <Form.Label className="mb-0">
                Change letters after <strong>{lettersValue}</strong> turns
              </Form.Label>
              <Form.Range
                key={`form-letterBlendCounter-${letterBlendCounter}`}
                type="number"
                name="letterBlendCounter"
                defaultValue={letterBlendCounter}
                min="1"
                max="10"
                step="1"
                disabled={running}
                onChange={(e) => setLettersValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="hardMode">
              <Form.Label className="mb-0">
                Hard mode after <strong>{hardModeValue}</strong> rounds{" "}
                <HardmodeTooltip />
              </Form.Label>
              <Form.Range
                key={`form-hardMode-${hardMode}`}
                type="number"
                name="hardMode"
                defaultValue={hardMode}
                min="1"
                max="10"
                step="1"
                disabled={running}
                onChange={(e) => setHardModeValue(e.target.value)}
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

const HardmodeTooltip = () => {
  const renderTooltip = (props) => (
    <Tooltip id="hardMode-tooltip" {...props}>
      Randomizes the bomb timer (subtracts a random number between 0 - timer/2)
    </Tooltip>
  )
  return (
    <OverlayTrigger overlay={renderTooltip}>
      <span style={{ width: "fit-content" }}>ℹ️</span>
    </OverlayTrigger>
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
  const hardMode = room.get("hardMode")

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

  const [boom, boomLetterBlend, boomWord] = useEventTimeout("boom", 950)

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
        {!running && !winner && <Rules />}
        <Rounds />
        <HeartLetters />
        {running && (
          <div className="my-5 position-relative">
            {boom && (
              <div className="h4 text-secondary position-absolute start-0 end-0 top-0 letterblend-fade">
                <Highlight
                  searchWords={[boomLetterBlend?.toUpperCase()]}
                  textToHighlight={boomWord?.toUpperCase() || ""}
                />
              </div>
            )}
            <div className="h1">{letterBlend?.toUpperCase()}</div>
            <PlayerInput />
            <div className="h3 position-relative ">
              <div
                className="position-absolute text-white"
                style={{
                  zIndex: "1",
                  fontSize: "1.5em",
                  top: "35px",
                  bottom: 0,
                  left: "-20px",
                  right: 0
                }}
              >
                {timer}
              </div>
              <div className={clsx(boom ? "boom" : "bombEntrance")}>
                <Bombsvg
                  className={clsx(
                    "animate__animated animate__infinite animate__pulse"
                  )}
                  style={{
                    maxWidth: "100px",
                    fill: hardMode ? "var(--bs-danger)" : "initial"
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {!running && winner && <Winner winner={winner} />}
      </div>
      <Players />
    </>
  )
}

const useEventTimeout = (event, timeout = 300) => {
  const { socket } = useSocket()
  const [state, setState] = useState([])

  useEffect(() => {
    const triggerEvent = (data) => {
      setState(data)
      setTimeout(() => setState([]), timeout)
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}

function Rounds() {
  const { room } = useRoom()
  const round = room.get("round")
  const running = room.get("running")
  const winner = room.get("winner")
  const hardMode = room.get("hardMode")

  if (!running && !winner) {
    return null
  }

  return (
    <div className={clsx(running && "mb-3")}>
      Round <strong>{round}</strong>{" "}
      {hardMode && <strong className="text-danger">Hardmode on!</strong>}
    </div>
  )
}

function Winner({ winner }) {
  const ref = React.useRef()
  const refCallback = React.useCallback((node) => {
    if (ref.current) {
      confetti.reset()
    }
    if (node) {
      var rect = node.getBoundingClientRect()
      confetti({
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        },
        particleCount: 100,
        startVelocity: 30,
        spread: 270
      })
    }
    ref.current = node
  }, [])

  return (
    <h3 className="mb-5">
      Winner!
      <div className="mt-2 display-3 animate__animated animate__bounceIn">
        <Avatar
          className="animate__animated animate__infinite animate__pulse animate__slow"
          style={{ width: "3em", marginBottom: "-.25em" }}
          id={winner.avatar}
        />
        <div ref={refCallback}>{winner.name}</div>
      </div>
    </h3>
  )
}

function useWordValidation(timeout = 300, callback) {
  const [validation, setValidation] = useState({})
  const { socket } = useSocket()

  useEffect(() => {
    const triggerValidation = (isValid, data) => {
      setValidation({ isValid, ...data })
      typeof callback === "function" && callback(isValid)
      setTimeout(() => setValidation({}), timeout)
    }

    socket.on("wordValidation", triggerValidation)
    return () => {
      socket.off("wordValidation", triggerValidation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return validation
}

function PlayerInput() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const [value, setValue] = useState("")
  const deferredValue = useDeferredValue(value)

  const validation = useWordValidation(500)

  const currentPlayer = room.get("currentPlayer")
  const isCurrentPlayer = currentPlayer === userId

  const submitForm = (e) => {
    e.preventDefault()
    socket.emit("checkWord", value, userId)
    e.target.reset()
  }

  const onChange = (value) => {
    const val = value.trim().toLowerCase()
    setValue(val)
    socket.emit("setGlobalInputText", val)
  }

  const color =
    validation.isValid === false
      ? "animate__animated animate__shakeX animate__faster border-danger"
      : validation.isValid
      ? "border-success"
      : ""

  const errorReason =
    validation.isUnique === false
      ? "Already used!"
      : validation.isDictionary === false
      ? "Not in my dictionary!"
      : validation.isBlend === false
      ? "Missing the letters above"
      : ""

  useEffect(() => {
    setValue("")
  }, [currentPlayer])

  useEffect(() => {
    socket.on("setGlobalInputText", setValue)
    return () => {
      socket.off("setGlobalInputText", setValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Form
        onSubmit={submitForm}
        className="d-flex justify-content-center mt-3 mb-4 flex-column m-auto position-relative"
        style={{ maxWidth: "20em" }}
      >
        <Form.Control
          className={clsx(color)}
          key={isCurrentPlayer}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          disabled={!isCurrentPlayer}
          {...(!isCurrentPlayer && { value: deferredValue })}
        />
        <Form.Text
          className="text-danger fw-bold position-absolute top-100 start-50 w-100"
          style={{ transform: "translate(-50%, 7%)" }}
        >
          {errorReason}
        </Form.Text>
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
  const [gainedHeartControls] = useHowl(soundGainedHeart)

  const validation = useWordValidation(500, (isValid) => {
    if (isValid) {
      validControls.play()
    } else {
      invalidControls.play()
    }
  })

  useEffect(() => {
    const triggerGainedHeart = () => gainedHeartControls.play()
    const triggerBoom = () => boomControls.play()
    const triggerUserJoined = () => userJoinedControls.play()
    const triggerWinner = () => winnerControls.play()

    socket.on("gainedHeart", triggerGainedHeart)
    socket.on("userJoined", triggerUserJoined)
    socket.on("winner", triggerWinner)
    socket.on("boom", triggerBoom)
    return () => {
      socket.off("gainedHeart", triggerGainedHeart)
      socket.off("userJoined", triggerUserJoined)
      socket.off("winner", triggerWinner)
      socket.off("boom", triggerBoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                value.lives <= 0 &&
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
              {value.name}
            </span>
            {running && (
              <span className="text-danger">
                {Array.from(Array(Number(value?.lives) || 0), (_, index) => (
                  <span key={index}>❤</span>
                ))}
              </span>
            )}
            {running && id !== currentPlayer && (
              <span className="ms-auto small">
                <Highlight
                  searchWords={[value.letterBlend]}
                  textToHighlight={value.text}
                />
              </span>
            )}
          </Stack>
        ))}
      </ListGroup>
    </div>
  )
}

export default Router
