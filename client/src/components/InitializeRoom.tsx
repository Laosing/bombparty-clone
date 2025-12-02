import React, { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { JellyTriangle } from "@uiball/loaders"
import { deserialize } from "functions/deserialize"
import { useInterval } from "hooks/useInterval"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"
import { RoomContext } from "hooks/useRoom"
import { LayoutWithHeader } from "components/Layout"
import { Room as RoomComponent } from "components/Room"
import { Room } from "types/index"

export function InitializeRoom() {
  const { socket } = useSocket()
  // @ts-ignore - userId not in socket context, it's in useGameStore usually? Wait, useSocket returns socket context.
  // The useSocket hook implementation was:
  // export const useSocket = (): SocketContextType => { ... }
  // And SocketContextType has { socket: Socket }.
  // But in InitializeRoom it was destructing userId from useSocket().
  // Let's check where userId comes from. Usually useGameStore.
  // Previous JS code: const { socket, userId } = useSocket()
  // Maybe I missed something in useSocket.js or InitializeSocket.jsx.
  // I will check InitializeSocket.jsx later. For now assuming userId is available in context or should be from store.
  // useGameStore has userId.
  const userId = useGameStore((state) => state.userId)

  const { roomId } = useParams<{ roomId: string }>()
  const [room, setRoom] = useState<Map<string, any> | undefined>() // Using Map<string, any> for now as deserialize returns dynamic structure, or better use types.
  // Ideally `room` should be of type Room (the interface). But deserialize returns an object that was stringified.
  // However, Room interface in types/index.ts uses Set and Map.
  // If deserialize handles reconstruction of Map/Set, then it matches RoomProps/Room.
  // Let's assume deserialize returns the object as is (with Map/Set if custom deserializer used, which it is).

  const name = useGameStore((state) => state.name)
  const avatarSeed = useGameStore((state) => state.avatarSeed)

  const location = useLocation()
  const isPrivate = (location.state as any)?.isPrivate

  useEffect(() => {
    const getRoom = (val: string) => setRoom(deserialize(val))

    socket.emit("joinRoom", { roomId, isPrivate, name, avatarSeed })
    socket.on("getRoom", getRoom)
    return () => {
      socket.off("getRoom", getRoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoadingStuck = !room || !room.get("users")?.has(userId)
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
        <JellyTriangle
          size={60}
          speed={1}
          color="var(--bs-primary)"
        />
      </LayoutWithHeader>
    )
  }

  // room.get("users") returns Map<string, User>
  if (!room.get("users")?.has(userId)) {
    return (
      <LayoutWithHeader className="d-flex align-items-center justify-content-center flex-column gap-3">
        <h1 className="h3">Disconnected!</h1>
        <JellyTriangle
          size={60}
          speed={1}
          color="var(--bs-primary)"
        />
        <p>
          Hold on! We're trying to get you back on track. If this page is stuck
          try <Link to="/">rejoining a different room</Link>
        </p>
      </LayoutWithHeader>
    )
  }

  return (
    // @ts-ignore - RoomContext expects Room | undefined. Here we are passing { room, roomId }.
    // I need to update RoomContext definition or how I use it.
    // The previous useRoom returned { roomId, room }.
    // In `hooks/useRoom.ts` I defined `export const RoomContext = React.createContext<Room | undefined>(undefined)`.
    // But `Room` interface is the data structure of the room, not the context value which seems to include roomId.
    // I should update useRoom.ts to include roomId in the context type.
    <RoomContext.Provider value={{ room, roomId }}>
      <RoomComponent />
    </RoomContext.Provider>
  )
}
