import React, { useContext } from "react"
import { Socket } from "socket.io-client"

export interface SocketContextType {
  socket: Socket;
  userId?: string; // Optional because initially it might not be there? Or should be always there?
                   // In InitializeSocket it comes from useGameStore.
}

export const SocketContext = React.createContext<SocketContextType | undefined>(undefined)
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
