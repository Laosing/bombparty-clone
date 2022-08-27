import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { deserialize } from "functions/deserialize"
import { Button, Badge } from "react-bootstrap"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"

export const Rooms = () => {
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
  }, [socket, userId])

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
