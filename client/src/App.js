import React, { useContext, useEffect, useState, useDeferredValue } from "react"
import io from "socket.io-client"

import "./App.scss"
import "animate.css"
import "react-toastify/dist/ReactToastify.css"

import {
  BrowserRouter,
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
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
  Tooltip,
  Badge
} from "react-bootstrap"
import clsx from "clsx"

import soundBoom from "audio/boom.mp3"
import soundLobby from "audio/lobby.m4a"
import soundLobby2 from "audio/lobby-2.m4a"
import soundValid from "audio/valid.mp3"
import soundInvalid from "audio/error.mp3"
import soundJoining from "audio/joining.mp3"
import soundLeaving from "audio/leaving.mp3"
import soundGainedHeart from "audio/gained-heart.wav"
import soundGainedBonusLetter from "audio/bonus-letter.mp3"
import soundWinner from "audio/winner.mp3"
import soundCountDown from "audio/beep.mp3"
import soundCountDownEnd from "audio/beep-end.mp3"

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
import { ToastContainer, toast } from "react-toastify"
import createActivityDetector from "activity-detector"

const isDevEnv = process.env.NODE_ENV === "development"

const log = isDevEnv ? console.log : () => {}

const LETTER_BONUS = 10
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
      musicVersion: 0,
      toggleMusicVersion: () =>
        set({ musicVersion: get().musicVersion === 0 ? 1 : 0 }),
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
    (set, get) => ({
      name: getRandomName(),
      setName: (name) => set({ name }),
      userId: nanoid(),
      theme: "light",
      switchTheme: () =>
        set({ theme: get().theme === "light" ? "dark" : "light" }),
      isAdmin: false,
      setIsAdmin: () => set({ isAdmin: !get().isAdmin })
    }),
    { name: "game-settings" }
  )
)

const Highlight = (props) => {
  // const theme = useGameStore((store) => store.theme)
  return (
    <Highlighter
      highlightTag="span"
      unhighlightClassName=""
      highlightClassName="text-warning"
      autoEscape={true}
      {...props}
    />
  )
}

function Header({ children }) {
  return (
    <Navbar bg="dark" variant="dark">
      <Container fluid>
        <Navbar.Brand className="m-auto p-0">💥💣 Bombparty 💣💥</Navbar.Brand>
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
  return (
    <InitializeSocket>
      <Outlet />
    </InitializeSocket>
  )
}

const Router = () => {
  const theme = useGameStore((store) => store.theme)
  return (
    <BrowserRouter>
      <ToastContainer
        autoClose={false}
        position="top-center"
        theme={theme}
        style={{ width: "100%", maxWidth: "600px" }}
      />
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
    {/* <Header /> */}
    <Layout {...props}>{children}</Layout>
  </>
)

const Layout = ({ children, className, ...props }) => {
  return (
    <Container
      className={clsx("my-lg-5 mt-3 mb-5 text-center", className)}
      {...props}
    >
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

  const [isPrivate, setIsPrivate] = useState(false)
  const toggle = () => setIsPrivate((p) => !p)

  return (
    <LayoutWithHeader className="pb-5">
      <h1 className="display-3">Welcome to 💣party!</h1>
      <p className="mb-5">Create or join a room to get started</p>
      <Button
        size="lg"
        as={Link}
        to={getRoomId()}
        className="mb-1"
        state={{ isPrivate }}
      >
        Create room
      </Button>
      <Form.Check
        id="private-room"
        checked={isPrivate}
        onChange={toggle}
        label="Private room"
        className="d-flex gap-2 justify-content-center mb-5"
      />
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
      <Rooms />
    </LayoutWithHeader>
  )
}

const Rooms = () => {
  const { socket } = useSocket()
  const [rooms, setRooms] = useState([])
  const userId = useGameStore((state) => state.userId)

  useEffect(() => {
    const getRooms = (val) => setRooms(new Map(deserialize(val)))

    socket.emit("leaveRoom", userId)
    socket.emit("getRooms")
    socket.on("getRooms", getRooms)
    return () => {
      socket.off("getRooms", getRooms)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gameRooms = [...rooms].filter(([, data]) => !data.isPrivate)

  return (
    <>
      <h2>Rooms</h2>
      <div className="d-flex align-content-start flex-wrap justify-content-center gap-3">
        {gameRooms.map(([room, data]) => (
          <Button
            key={room}
            as={Link}
            to={room}
            variant="secondary"
            className="d-inline-flex align-items-center fw-bold"
          >
            {room}
            <Badge bg="dark" className="ms-2" style={{ fontSize: "0.7em" }}>
              {data.players.size}
            </Badge>
          </Button>
        ))}
        {gameRooms.length === 0 && (
          <small className="text-muted">No active public rooms</small>
        )}
      </div>
    </>
  )
}

const Rules = ({ className }) => {
  const setIsAdmin = useGameStore((state) => state.setIsAdmin)
  const toggleAdmin = () => setIsAdmin((p) => !p)
  const theme = useGameStore((store) => store.theme)
  return (
    <Alert
      style={{ maxWidth: "30em" }}
      className={clsx("mx-auto", className)}
      variant={theme === "light" ? "primary" : "warning"}
    >
      <h5>Rules 🧐</h5>
      <p className="small">
        On a player's turn they must type a word (3 letters or more) containing
        the given letters in the <strong>same order</strong> before the bomb
        explodes <span onClick={toggleAdmin}>🤯</span> (example: LU - BLUE).
      </p>
      <p className="small">
        If a player does not type a word in time, they lose a heart 💀. The last
        player remaining wins the game 🎉.
      </p>
      <p className="small mb-0">
        The alphabet is at the top, use all the letters to gain a heart ❤️.
        Bonus for long words: if the word is 11 letters or longer the player
        gets a free random letter 🤓.
      </p>
    </Alert>
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

  return <InitializeRoom />
}

const SocketContext = React.createContext()
export const useSocket = () => useContext(SocketContext)

const InitializeSocket = ({ children }) => {
  const [socket, setSocket] = useState(undefined)
  const userId = useGameStore((state) => state.userId)

  useEffect(() => {
    if (!socket) {
      const logger = (event, ...args) => {
        log(
          "%c" + event,
          "color: pink;",
          event === "getRoom" ? deserialize(args) : args
        )
      }

      const params = { auth: { userId } }
      const props = isDevEnv
        ? [`http://${window.location.hostname}:8080`, params]
        : [params]

      const newSocket = io(...props)
      setSocket(newSocket)
      log("setting socket!", newSocket)

      newSocket.onAny(logger)
      return () => {
        log("closing!")
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
      {children}
    </SocketContext.Provider>
  )
}

const RoomContext = React.createContext()
export const useRoom = () => React.useContext(RoomContext)

function InitializeRoom() {
  const { socket, userId } = useSocket()
  const { roomId } = useParams()
  const [room, setRoom] = useState()
  const name = useGameStore((state) => state.name)
  const location = useLocation()
  const isPrivate = location.state?.isPrivate

  useEffect(() => {
    const getRoom = (val) => setRoom(deserialize(val))

    socket.emit("joinRoom", roomId, isPrivate, name)
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

const useIdle = () => {
  const timeout = React.useRef()
  const toastId = React.useRef()
  const navigate = useNavigate()

  const activityDetector = React.useMemo(() => {
    const detector = createActivityDetector({
      timeToIdle: 1000 * 60 * 5,
      inactivityEvents: []
    })
    const warning =
      "You there? If not you will be redirected to the homepage in 30 seconds."
    const onOpen = () => {
      timeout.current = setTimeout(() => {
        navigate("/")
        toast.dismiss(toastId.current)
      }, 1000 * 30)
    }

    const onIdle = () => {
      toastId.current = toast.warn(warning, { onOpen, toastId: "idle-toast" })
    }
    const onActive = () => {
      clearTimeout(timeout.current)
      toast.dismiss(toastId.current)
    }
    detector.on("idle", onIdle)
    detector.on("active", onActive)

    return detector
  }, [navigate])

  useEffect(() => {
    return () => activityDetector.stop()
  }, [activityDetector])
}

const PrivateTooltip = () => {
  const renderTooltip = (props) => (
    <Tooltip id="private-tooltip" {...props}>
      This room is private
    </Tooltip>
  )
  return (
    <OverlayTrigger overlay={renderTooltip}>
      <span>🔒</span>
    </OverlayTrigger>
  )
}

function Room() {
  const { roomId, room } = useRoom()
  const theme = useGameStore((state) => state.theme)
  const isPrivate = room.get("private")

  useIdle()

  return (
    <>
      {/* <Header /> */}
      <Container fluid className={clsx("d-flex flex-grow-1", theme)}>
        <Row className="flex-grow-1">
          <Col md={8}>
            <Layout className="p-0">
              <Game />
            </Layout>
          </Col>
          <Col md={4} className={clsx("p-0 d-flex flex-column sidebar")}>
            <div className="p-3 pb-0 text-center">
              <AvatarSettings />
              <HeaderUser />
            </div>
            <ListGroup className="p-3">
              <ListGroup.Item className="d-flex justify-content-between align-items-center p-2">
                <span>
                  Current room: <strong>{roomId}</strong>{" "}
                  {isPrivate && <PrivateTooltip />}
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

const Hr = () => <hr className={clsx("hr m-0")} />

const MusicLabel = ({ toggleMusicVersion }) => (
  <>
    Music{" "}
    <Badge
      as={Button}
      bg="secondary border-0"
      style={{ fontSize: ".65em" }}
      onClick={toggleMusicVersion}
    >
      Change song
    </Badge>
  </>
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

  const theme = useGameStore((store) => store.theme)
  const switchTheme = useGameStore((store) => store.switchTheme)
  const toggleMusicVersion = useSoundStore((store) => store.toggleMusicVersion)

  useEffect(() => {
    Howler.volume(volume)
  }, [volume])

  return (
    <Form className="p-3">
      <Row>
        <Col>
          <Form.Check
            type="switch"
            id="settingsMusic"
            checked={!!music}
            onChange={toggleMusic}
            label={<MusicLabel toggleMusicVersion={toggleMusicVersion} />}
          />
          <Form.Check
            type="switch"
            id="settingsSoundEffects"
            checked={!!soundEffects}
            onChange={toggleSoundEffects}
            label="Sound effects"
          />
        </Col>
        <Col>
          <Form.Check
            type="switch"
            id="settingsTheme"
            checked={theme === "dark"}
            onChange={switchTheme}
            label="Dark Mode"
          />
        </Col>
      </Row>
      <Form.Label htmlFor="settingsVolume" className="mt-2 mb-0">
        Volume
      </Form.Label>
      <Form.Range
        id="settingsVolume"
        defaultValue={volume}
        min="0"
        max="1"
        step=".025"
        onChange={(e) => setVolume(e.target.value)}
      />
    </Form>
  )
}

function HeartLetters() {
  const { userId } = useSocket()
  const { room } = useRoom()

  const running = room.get("running")
  const user = room.get("users").get(userId)
  const userLetters = [...user.letters]
  const userBonusLetters = [...user.bonusLetters]
  const alphabet = "abcdefghijklmnopqrstuvwxyz"

  if (!running) {
    return null
  }

  return (
    <div style={{ maxWidth: "477px" }} className="m-auto">
      {[...alphabet].map((letter) => (
        <Button
          as={"span"}
          size="sm"
          key={letter}
          variant={
            userBonusLetters.includes(letter)
              ? "warning"
              : userLetters.includes(letter)
              ? "dark"
              : "outline-dark"
          }
          className={`disabled me-1 mb-1 heart-letters-btn`}
          style={{ width: "31px" }}
        >
          {letter.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}

function GameSettings() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const users = room.get("users")
  const running = room.get("running")
  const isCountDown = room.get("isCountDown")
  const settings = room.get("settings")
  const lives = settings.get("lives")
  const timer = settings.get("timer")
  const letterBlendCounter = settings.get("letterBlendCounter")
  const hardMode = settings.get("hardMode")
  const hardModeEnabled = settings.get("hardModeEnabled")

  const canEditSettings = !Boolean(
    [...users].find(([id, val]) => val.inGame && id === userId)
  )

  const disabled = running || canEditSettings || isCountDown

  const submitForm = (e) => {
    if (disabled) return
    e.preventDefault()
    var formData = new FormData(e.target)
    const lives = formData.get("lives")
    const timer = formData.get("timer")
    const letterBlendCounter = formData.get("letterBlendCounter")
    const hardMode = formData.get("hardMode")
    const hardModeEnabled = Boolean(formData.get("hardModeEnabled"))
    const data = { lives, timer, letterBlendCounter, hardMode, hardModeEnabled }
    socket.emit("setSettings", data)
  }

  const [notification, setNotification] = useState(false)

  const [timerValue, setTimerValue] = useState(timer)
  const [livesValue, setLivesValue] = useState(lives)
  const [lettersValue, setLettersValue] = useState(letterBlendCounter)
  const [hardModeValue, setHardModeValue] = useState(hardMode)
  const [hardModeToggle, setHardModeToggle] = useState(hardModeEnabled)

  useEffect(() => {
    const triggerValidation = (val) => {
      val = deserialize(val)
      setTimerValue(val.get("timer"))
      setLivesValue(val.get("lives"))
      setLettersValue(val.get("letterBlendCounter"))
      setHardModeToggle(val.get("hardModeEnabled"))
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
                onChange={(e) => setLettersValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="hardMode">
              <Form.Check
                type="switch"
                checked={Boolean(hardModeToggle)}
                onChange={() => setHardModeToggle((p) => !p)}
                label=""
                className="d-inline-block"
                name="hardModeEnabled"
                id="hardModeEnabled"
                disabled={disabled}
              />
              <Form.Label
                className="mb-0"
                style={{ opacity: hardModeToggle ? 1 : 0.5 }}
              >
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
                disabled={disabled || !hardModeToggle}
                onChange={(e) => setHardModeValue(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex align-items-end">
              <Button
                type="submit"
                variant={notification ? "success" : "secondary"}
                className="w-100"
                disabled={disabled}
                size="sm"
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

function CountDown() {
  const { socket } = useSocket()
  const [countDown, setCountDown] = useState()
  const [audioCountDown] = useHowl(soundCountDown)
  const [audioCountDownEnd] = useHowl(soundCountDownEnd)

  useEffect(() => {
    const triggerCountDown = (val) => {
      setCountDown(val)
      if (typeof val === "number") {
        val === 0 ? audioCountDownEnd.play() : audioCountDown.play()
      }
    }
    socket.on("startCountDown", triggerCountDown)
    return () => {
      socket.off("startCountDown", triggerCountDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (typeof countDown !== "number") {
    return null
  }

  return (
    <div className="py-5">
      <div>The game starts in</div>
      <div className="h1">{countDown}</div>
    </div>
  )
}

function Game() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()
  const musicVersion = useSoundStore((store) => store.musicVersion)

  const letterBlend = room.get("letterBlend")
  const timer = room.get("timer")
  const running = room.get("running")
  const winner = room.get("winner")
  const hardMode = room.get("hardMode")
  const users = room.get("users")
  const isCountDown = room.get("isCountDown")

  const isInGame = users.get(userId).inGame

  const [lobbyMusic] = useHowl(
    musicVersion === 0 ? soundLobby2 : soundLobby,
    "music",
    {
      loop: true,
      autoplay: true
    }
  )

  const [[boom, boomLetterBlend, boomWord], resetBoom] = useBoomTimeout("boom")

  const toggleGame = () => {
    if (running) {
      log("STOP!")
      socket.emit("stopGame")
    } else {
      log("START!")
      socket.emit("startGame")
    }
  }

  const joinGame = () => socket.emit("joinGame", userId)
  const leaveGame = () => socket.emit("leaveGame", userId)
  const startGameNoCounter = () => socket.emit("startGameNoCounter")

  useEffect(() => {
    if (running || isCountDown) {
      lobbyMusic.stop()
    } else {
      resetBoom()
      const sound = lobbyMusic.play()
      lobbyMusic.fade(0, 1, 2000, sound)
    }
  }, [running, lobbyMusic, resetBoom, isCountDown])

  return (
    <>
      <div className="">
        <Stack
          className="position-relative justify-content-center align-items-center mb-3"
          gap={3}
          direction="horizontal"
        >
          {!running && !isCountDown && (
            <>
              {isInGame ? (
                <Button variant="danger" onClick={() => leaveGame()}>
                  Leave game
                </Button>
              ) : (
                <Button variant="primary" onClick={() => joinGame()}>
                  Join game
                </Button>
              )}
            </>
          )}
          {isInGame && !isCountDown && (
            <Button
              variant={running ? "danger" : "primary"}
              onClick={toggleGame}
              className=""
            >
              {running ? "Stop" : "Start Game"}
            </Button>
          )}
          {isCountDown && (
            <Button onClick={startGameNoCounter}>Start Now</Button>
          )}
        </Stack>
        {!running && !winner && !isCountDown && <Rules />}
        <CountDown />
        <HeartLetters />
        {running && (
          <div className="my-3 position-relative">
            <div className="h1 mb-0 mt-2">{letterBlend?.toUpperCase()}</div>
            <PlayerInput
              boomWord={boomWord}
              boomLetterBlend={boomLetterBlend}
            />
            <div
              className="h3 position-relative m-auto d-flex justify-content-center align-items-center"
              style={{ maxWidth: "80px", height: "80px" }}
            >
              <div
                className="position-absolute text-white"
                style={{
                  zIndex: "11",
                  fontSize: "1.2em",
                  transform: `translate(${
                    String(timer).length > 1 ? "-20%" : "-40%"
                  }, 20%)`
                }}
              >
                {timer}
              </div>
              <div
                className={clsx(
                  boom ? "boom" : "bombEntrance",
                  "position-relative"
                )}
              >
                <Bombsvg
                  className={clsx(
                    "animate__animated animate__infinite animate__pulse w-100"
                  )}
                  style={{
                    fill: hardMode ? "var(--bs-danger)" : "initial"
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {!running && winner && !isCountDown && (
          <Winner
            winner={winner}
            boomWord={boomWord}
            boomLetterBlend={boomLetterBlend}
          />
        )}
      </div>
      <Players />
      <Lobby />
    </>
  )
}

const Lobby = () => {
  const { room } = useRoom()
  const players = room.get("users")
  const running = room.get("running")

  const lobbyPlayers = [...players].filter(([, val]) => !val.inGame)

  if (running || lobbyPlayers.length === 0) {
    return null
  }

  const tooltip = (props, name) => (
    <Tooltip id="avatar-tooltip" {...props}>
      {name}
    </Tooltip>
  )

  return (
    <div style={{ maxWidth: "30em" }} className="mx-auto">
      <hr />
      <h5>Players not in game</h5>
      {lobbyPlayers.map(([id, val]) => (
        <OverlayTrigger key={id} overlay={(props) => tooltip(props, val.name)}>
          <div style={{ width: "3em" }} className="d-inline-block">
            <Avatar id={val.avatar} />
          </div>
        </OverlayTrigger>
      ))}
    </div>
  )
}

const useEventTimeout = (event, initialValue, timeout = 300) => {
  const { socket } = useSocket()
  const [state, setState] = useState(initialValue)

  useEffect(() => {
    const triggerEvent = (data) => {
      setState(data)
      setTimeout(() => setState(initialValue), timeout)
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [state]
}

const useBoomTimeout = (event, timeout = 900) => {
  const { socket } = useSocket()
  const [state, setState] = useState([])

  const resetState = React.useCallback(
    () =>
      setState((prev) => {
        clearTimeout(prev[3])
        return []
      }),
    []
  )

  useEffect(() => {
    const triggerEvent = (data) => {
      const timer = setTimeout(() => setState([false, "", ""]), timeout)
      setState([...data, timer])
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [state, resetState]
}

function Rounds() {
  const { room } = useRoom()
  const round = room.get("round")
  const running = room.get("running")
  const hardMode = room.get("hardMode")

  if (!running) {
    return null
  }

  return (
    <div
      style={{ top: "-2em" }}
      className={clsx(hardMode && "text-danger", "position-absolute")}
    >
      Round <strong>{round}</strong>
    </div>
  )
}

function Winner({ winner, boomWord, boomLetterBlend }) {
  const { room } = useRoom()
  const round = room.get("round")
  const hardMode = room.get("hardMode")

  const [lastWord, setLastWord] = useState("")
  const [lastLetterBlend, setLastLetterBlend] = useState("")

  useEffect(() => {
    if (boomWord) {
      setLastWord(boomWord)
      setLastLetterBlend(boomLetterBlend)
    }
  }, [boomWord, boomLetterBlend])

  const ref = React.useRef()
  const refCallback = React.useCallback((node) => {
    if (ref.current) {
      confetti.reset()
    }
    if (node) {
      var rect = node.getBoundingClientRect()
      confetti({
        disableForReducedMotion: true,
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
    <div>
      <div className="mt-2 animate__animated animate__bounceIn">
        <Avatar
          className="animate__animated animate__infinite animate__pulse animate__slow"
          style={{ width: "10em", marginBottom: "-.5em" }}
          id={winner.avatar}
        />
        <h3 className="mb-0">
          Winner!{" "}
          <Badge
            bg={hardMode ? "danger" : "primary"}
            className="align-middle"
            style={{ fontSize: ".5em" }}
          >
            Round {round}
          </Badge>
        </h3>

        <div className="display-3 mb-3" ref={refCallback}>
          {winner.name}
        </div>
        {lastWord && (
          <div className="mb-4">
            <strong>Last word:</strong>{" "}
            <Badge
              bg="secondary"
              className="align-middle"
              style={{ fontSize: "1em" }}
            >
              <Highlight
                searchWords={[lastLetterBlend?.toUpperCase()]}
                textToHighlight={lastWord?.toUpperCase()}
              />
            </Badge>
          </div>
        )}
      </div>
    </div>
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

function PlayerInput({ boomWord, boomLetterBlend }) {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const [value, setValue] = useState("")
  const deferredValue = useDeferredValue(value)

  const validation = useWordValidation(500)

  const [bonusLetter] = useEventTimeout("bonusLetter", "", 1000)

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
        className="d-flex justify-content-center mt-1 mb-2 flex-column m-auto position-relative"
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
        {deferredValue && (
          <Badge
            bg={
              deferredValue.length > LETTER_BONUS
                ? "warning text-dark"
                : "secondary"
            }
            className="position-absolute top-50 end-0 translate-middle-y me-2"
          >
            {deferredValue.length}
          </Badge>
        )}
        {boomWord && (
          <Badge
            key={boomWord}
            className="position-absolute top-100 start-50"
            style={{
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: "1em"
            }}
          >
            <Highlight
              searchWords={[boomLetterBlend?.toUpperCase()]}
              textToHighlight={boomWord?.toUpperCase()}
            />
          </Badge>
        )}
        {bonusLetter && (
          <Badge
            bg="warning text-dark"
            className="position-absolute top-100 start-50"
            style={{
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: "1em"
            }}
          >
            {bonusLetter.toUpperCase()}
          </Badge>
        )}
        {errorReason && (
          <Badge
            bg="danger"
            className="position-absolute top-100 start-50"
            style={{
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: "1em"
            }}
          >
            {errorReason}
          </Badge>
        )}
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

  const isAdmin = useGameStore((state) => state.isAdmin)

  const [validControls] = useHowl(soundValid)
  const [invalidControls] = useHowl(soundInvalid)
  const [boomControls] = useHowl(soundBoom)
  const [winnerControls] = useHowl(soundWinner)
  const [userJoinedControls] = useHowl(soundJoining)
  const [userLeftControls] = useHowl(soundLeaving)
  const [gainedHeartControls] = useHowl(soundGainedHeart)
  const [gainedBonusLetter] = useHowl(soundGainedBonusLetter)

  const validation = useWordValidation(500, (isValid) => {
    if (isValid) {
      validControls.play()
    } else {
      invalidControls.play()
    }
  })

  useEffect(() => {
    const triggerGainedBonusLetter = () => gainedBonusLetter.play()
    const triggerGainedHeart = () => gainedHeartControls.play()
    const triggerBoom = () => boomControls.play()
    const triggerUserJoined = () => userJoinedControls.play()
    const userLeft = () => userLeftControls.play()
    const triggerWinner = () => winnerControls.play()

    socket.on("bonusLetter", triggerGainedBonusLetter)
    socket.on("gainedHeart", triggerGainedHeart)
    socket.on("userJoined", triggerUserJoined)
    socket.on("userLeft", userLeft)
    socket.on("winner", triggerWinner)
    socket.on("boom", triggerBoom)
    return () => {
      socket.off("bonusLetter", triggerGainedBonusLetter)
      socket.off("gainedHeart", triggerGainedHeart)
      socket.off("userJoined", triggerUserJoined)
      socket.off("userLeft", userLeft)
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

  const kickPlayer = (userId) => socket.emit("kickPlayer", userId)
  const highestScore = Math.max(...[...players].map(([, val]) => val.score))

  return (
    <div>
      {!running && <h5>Players</h5>}
      <div
        style={{ maxWidth: "30em" }}
        className="m-auto position-relative px-4"
      >
        <Rounds />
        <ListGroup>
          {Array.from(players)
            .filter(([_, val]) => val.inGame)
            .map(([id, value]) => (
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
                  <Badge
                    className="position-absolute top-0 start-100 translate-middle"
                    bg={
                      highestScore > 0 && value.score === highestScore
                        ? "primary"
                        : "secondary"
                    }
                    style={{ fontSize: ".65em" }}
                  >
                    {value.score}
                  </Badge>
                </span>
                {isAdmin && (
                  <span
                    className="position-absolute top-50 end-0"
                    style={{
                      width: "35px",
                      transform: `translate(100%, -50%)`
                    }}
                    onClick={() => kickPlayer(id)}
                  >
                    🥾
                  </span>
                )}
                <span
                  className={clsx(
                    id === currentPlayer && "fw-bold",
                    id === validation.currentPlayer && textColor
                  )}
                >
                  {id === currentPlayer && (
                    <span className="position-absolute top-50 start-100 translate-middle">
                      <span className="animate__animated animate__infinite animate__pulse d-block">
                        💣
                      </span>
                    </span>
                  )}
                  {value.name}
                </span>
                {running && (
                  <span className="text-danger">
                    {Array.from(
                      Array(Number(value?.lives) || 0),
                      (_, index) => (
                        <span key={index}>❤</span>
                      )
                    )}
                  </span>
                )}
                {running && id !== currentPlayer && (
                  <>
                    <span className="ms-auto small">
                      <Highlight
                        searchWords={[value.letterBlend]}
                        textToHighlight={value.text}
                      />
                    </span>
                    {Boolean(value.text.length) && (
                      <Badge
                        bg={
                          value.text.length > LETTER_BONUS
                            ? "warning text-dark"
                            : "secondary"
                        }
                        style={{ fontSize: ".5em" }}
                      >
                        {value.text.length}
                      </Badge>
                    )}
                  </>
                )}
              </Stack>
            ))}
        </ListGroup>
      </div>
    </div>
  )
}

export default Router
