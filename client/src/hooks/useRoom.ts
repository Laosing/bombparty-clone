import React from "react"

export interface RoomContextType {
  room: Map<string, any>;
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
