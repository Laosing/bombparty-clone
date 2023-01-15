import React, { useEffect } from "react"
import { Button, Stack } from "react-bootstrap"
import clsx from "clsx"
import soundLobby from "audio/lobby.m4a"
import soundLobby2 from "audio/lobby-2.m4a"
import { ReactComponent as Bombsvg } from "images/bomb.svg"
import { log } from "functions/session"
import { useGameStore, useSoundStore } from "hooks/useStore"
import { useRoom } from "hooks/useRoom"
import { useHowl } from "hooks/useHowl"
import { useSocket } from "hooks/useSocket"
import { Highlight } from "components/Highlight"
import { Rules } from "components/Rules"
import { HeartLetters } from "components/HeartLetters"
import { CountDown } from "components/CountDown"
import { useEventTimeout } from "hooks/useEventTimeout"
import { useBoomTimeout } from "hooks/useBoomTimeout"
import { PlayerInput } from "components/PlayerInput"
import { Players } from "components/Players"
import { Winner } from "components/Winner"
import { Lobby } from "components/Lobby"

export function Game() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()
  const musicVersion = useSoundStore((store) => store.musicVersion)
  const name = useGameStore((state) => state.name)
  const theme = useGameStore((store) => store.theme)

  const letterBlend = room.get("letterBlend")
  const timer = room.get("timer")
  const running = room.get("running")
  const winner = room.get("winner")
  const hardMode = room.get("hardMode")
  const users = room.get("users")
  const groups = room.get("groups")
  const isCountDown = room.get("isCountDown")

  const hasPlayers = Array.from(groups).filter(
    ([, group]) => group.members.size
  ).length
  const isInGame = users.get(userId).inGame && hasPlayers

  const [lobbyMusic] = useHowl(
    musicVersion === 0 ? soundLobby2 : soundLobby,
    "music",
    {
      loop: true,
      autoplay: true,
    }
  )

  const [boom] = useEventTimeout("boom")
  const [[boomLetterBlend, boomWord], resetBoom] = useBoomTimeout("boomWord")

  const toggleGame = () => {
    if (running) {
      log("STOP!")
      socket.emit("stopGame", null, userId)
    } else {
      log("START!")
      socket.emit("startGame", userId)
    }
  }

  const joinGame = () => socket.emit("joinGame", userId, name)
  const leaveGame = () => socket.emit("leaveGame", userId)
  const startGameNoCounter = () => socket.emit("startGameNoCounter", userId)

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
          {isInGame && isCountDown && (
            <Button onClick={startGameNoCounter}>Start Now</Button>
          )}
        </Stack>
        {!running && !winner && !isCountDown && <Rules />}
        <CountDown isCountDown={isCountDown} />
        {running && isInGame && <HeartLetters />}
        {running && (
          <div className="my-3 position-relative">
            {boomWord && (
              <div
                className="position-absolute w-100 m-auto text-secondary"
                style={{
                  transform: "translate(0, -70%)",
                  fontSize: "0.8em",
                  letterSpacing: ".1em",
                  fontWeight: "700",
                }}
              >
                <Highlight
                  searchWords={[boomLetterBlend?.toUpperCase()]}
                  textToHighlight={boomWord?.toUpperCase()}
                  highlightClassName={
                    theme === "light" ? "text-danger" : "text-warning"
                  }
                />
              </div>
            )}
            <div className="h1 mb-0 mt-2">{letterBlend?.toUpperCase()}</div>
            <PlayerInput />
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
                  }, 20%)`,
                }}
              >
                {timer}
              </div>
              <div className={clsx(boom && "boom", "position-relative")}>
                <Bombsvg
                  className={clsx(
                    "animate__animated animate__infinite animate__pulse w-100"
                  )}
                  style={{
                    fill: hardMode ? "var(--bs-danger)" : "initial",
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {!running && winner && !isCountDown && <Winner winner={winner} />}
      </div>
      <Players />
      <Lobby />
    </>
  )
}
