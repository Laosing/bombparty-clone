import React from "react"
import { Button } from "react-bootstrap"
import { Avatar } from "components/Avatar"
import { useRoom } from "hooks/useRoom"
import { useSocket } from "hooks/useSocket"
import { useGameStore } from "hooks/useStore"
import { nanoid } from "nanoid"

export function AvatarSettings() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()
  const setAvatarSeed = useGameStore((state) => state.setAvatarSeed)

  const users = room.get("users")
  const currentGroup = users.get(userId)

  const editAvatar = () => {
    const newSeed = nanoid()
    setAvatarSeed(newSeed)
    socket.emit("updateAvatar", userId, newSeed)
  }

  return (
    <div className="d-flex justify-content-center align-items-center ">
      <div className="position-relative">
        <Avatar style={{ width: "75px" }} id={currentGroup.avatar} />
        <Button
          style={{ transform: "translate(70%, 0)" }}
          className="text-decoration-none border-0 position-absolute bottom-0 end-0"
          onClick={editAvatar}
          size="sm"
          variant="link"
          title="Change avatar"
        >
          ✒️
        </Button>
      </div>
    </div>
  )
}
