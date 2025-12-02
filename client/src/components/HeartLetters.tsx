import React from "react"
import Button from "react-bootstrap/Button"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { Group, User } from "types/index"

export function HeartLetters() {
  const { userId } = useSocket()
  const { room } = useRoom()

  const running = room.get("running")
  const groups = room.get("groups") as Map<string, Group>
  const users = room.get("users") as Map<string, User>

  // @ts-ignore
  const groupId = users.get(userId || "")?.group
  const group = groups.get(groupId || "")
  const userLetters = [...(group?.letters || [])]
  const userBonusLetters = [...(group?.bonusLetters || [])]
  const alphabet = "abcdefghijklmnopqrstuvwxyz"

  if (!running) {
    return null
  }

  return (
    <div
      style={{ maxWidth: "477px" }}
      className="m-auto"
    >
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
