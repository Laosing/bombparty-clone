import React, { useEffect } from "react"
import { Button, Stack, ListGroup, Badge } from "react-bootstrap"
import clsx from "clsx"
import soundBoom from "audio/boom.mp3"
import soundValid from "audio/valid.mp3"
import soundInvalid from "audio/error.mp3"
import soundJoining from "audio/joining.mp3"
import soundLeaving from "audio/leaving.mp3"
import soundGainedHeart from "audio/gained-heart.wav"
import soundGainedBonusLetter from "audio/bonus-letter.mp3"
import soundWinner from "audio/winner.mp3"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { useWordValidation } from "hooks/useEventTimeout"
import { useHowl } from "hooks/useHowl"
import { LETTER_BONUS } from "constants/constants"
import { Highlight } from "components/Highlight"
import { Avatar } from "components/Avatar"
import { Rounds } from "components/Rounds"

export function Players() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()
  const players = room.get("users")
  const user = players.get(userId)
  const groups = room.get("groups")
  const running = room.get("running")
  const currentGroup = room.get("currentGroup")
  const isCountDown = room.get("isCountDown")

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

  const kickPlayer = (kickedUserId) =>
    socket.emit("kickPlayer", kickedUserId, userId)
  const highestScore = Math.max(...[...groups].map(([, val]) => val.score))

  const joinGroup = (groupId) => socket.emit("joinGroup", groupId, userId)

  const isInGroup = (groupId) => user.group !== groupId

  return (
    <div>
      {!running && <h5>Players</h5>}
      <div
        style={{ maxWidth: "30em" }}
        className="m-auto position-relative px-4"
      >
        <Rounds />

        {Array.from(groups, ([groupId, group]) => {
          return (
            <ListGroup key={groupId} className="mb-3">
              {[...group.members].map((memberId, index) => {
                const isActiveTyper =
                  group.activeTyper % group.members.size === index
                const member = players.get(memberId)
                const onlyRowOne = index === 0
                return (
                  <Stack
                    direction="horizontal"
                    gap={2}
                    key={memberId}
                    className={clsx(
                      "position-relative",
                      "list-group-item",
                      running &&
                        group.lives <= 0 &&
                        "list-group-item-secondary text-decoration-line-through",
                      groupId === currentGroup && "list-group-item-primary",
                      groupId === currentGroup &&
                        isActiveTyper &&
                        running &&
                        "activeTyper"
                    )}
                  >
                    <span
                      className="position-absolute top-50 start-0"
                      style={{
                        width: "35px",
                        transform: `translate(-120%, -50%)`
                      }}
                    >
                      {!running && <Avatar id={member.avatar} />}
                      {running &&
                        (group.lives > 0 ? (
                          <Avatar id={member.avatar} />
                        ) : (
                          "💀"
                        ))}
                      {onlyRowOne && (
                        <Badge
                          className="position-absolute top-0 start-100 translate-middle"
                          bg={
                            highestScore > 0 && group.score === highestScore
                              ? "primary"
                              : "secondary"
                          }
                          style={{ fontSize: ".65em" }}
                        >
                          {group.score}
                        </Badge>
                      )}
                    </span>

                    {isAdmin && (
                      <Button
                        variant="link"
                        className="position-absolute top-50 end-0 text-decoration-none p-0"
                        style={{
                          width: "35px",
                          transform: `translate(100%, -50%)`
                        }}
                        onClick={() => kickPlayer(member.id)}
                      >
                        🥾
                      </Button>
                    )}

                    <span
                      className={clsx(
                        groupId === currentGroup && "fw-bold",
                        groupId === validation.currentGroup && textColor
                      )}
                    >
                      {groupId === currentGroup && onlyRowOne && (
                        <span className="position-absolute top-50 start-100 translate-middle">
                          <span className="animate__animated animate__infinite animate__pulse d-block">
                            💣
                          </span>
                        </span>
                      )}
                      {member.name}
                      {isActiveTyper && running && " ✏️"}
                    </span>

                    {running && onlyRowOne && (
                      <span className="text-danger">
                        {Array.from(
                          Array(Number(group?.lives) || 0),
                          (_, index) => (
                            <span key={index}>❤</span>
                          )
                        )}
                      </span>
                    )}

                    {running && groupId !== currentGroup && onlyRowOne && (
                      <>
                        <span className="ms-auto small">
                          <Highlight
                            searchWords={[group.letterBlend]}
                            textToHighlight={group.text}
                            highlightClassName="text-danger"
                          />
                        </span>
                        {Boolean(group.text.length) && (
                          <Badge
                            bg={
                              group.text.length > LETTER_BONUS
                                ? "warning text-dark"
                                : "secondary"
                            }
                            style={{ fontSize: ".5em" }}
                          >
                            {group.text.length}
                          </Badge>
                        )}
                      </>
                    )}

                    {isInGroup(groupId) &&
                      !isCountDown &&
                      !running &&
                      onlyRowOne &&
                      user.inGame && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="ms-auto py-0 text-decoration-none"
                          onClick={() => joinGroup(groupId)}
                        >
                          Join Team
                        </Button>
                      )}

                    {!isInGroup(groupId) &&
                      !isCountDown &&
                      group.members.size > 1 &&
                      !running &&
                      onlyRowOne &&
                      user.inGame && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ms-auto py-0 text-decoration-none"
                          onClick={() => joinGroup()}
                        >
                          Leave team
                        </Button>
                      )}
                  </Stack>
                )
              })}
            </ListGroup>
          )
        })}
      </div>
    </div>
  )
}
