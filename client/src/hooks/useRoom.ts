import React from "react"
import { Room } from "types/index" // Adjusted path based on alias config

// The context value seems to be an object wrapping the room data and the roomId.
// Based on InitializeRoom.tsx: <RoomContext.Provider value={{ room, roomId }}>
// `room` is likely a Map (deserialized).
// Let's define the Context type properly.

export interface RoomContextType {
    room: any; // Ideally Room, but since it's a Map in the component usage, let's keep it flexible or fix it.
              // In Room.tsx: const { roomId, room } = useRoom()
              // and room.get("private")
              // So room is indeed a Map.
    roomId: string;
}

export const RoomContext = React.createContext<RoomContextType | undefined>(undefined)

export const useRoom = (): RoomContextType => {
    const context = React.useContext(RoomContext)
    if (!context) {
        throw new Error("useRoom must be used within a RoomProvider")
    }
    return context
}
