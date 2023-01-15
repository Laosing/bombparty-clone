import React, { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { JellyTriangle } from "@uiball/loaders"
import { deserialize } from "functions/deserialize"
import { useInterval } from "hooks/useInterval"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"
import { RoomContext } from "hooks/useRoom"
import { LayoutWithHeader } from "components/Layout"
import { Room } from "components/Room"

export function InitializeRoom() {
  const { socket, userId } = useSocket()
  const { roomId } = useParams()
  const [room, setRoom] = useState()
  const name = useGameStore((state) => state.name)
  const avatarSeed = useGameStore((state) => state.avatarSeed)

  const location = useLocation()
  const isPrivate = location.state?.isPrivate

  useEffect(() => {
    const getRoom = (val) => setRoom(deserialize(val))

    socket.emit("joinRoom", roomId, isPrivate, name, avatarSeed)
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
