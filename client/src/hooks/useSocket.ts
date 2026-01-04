import React, { useContext } from "react"
import type { Socket } from "socket.io-client"

export interface SocketContextType {
  socket: Socket;
  userId: string;
}

export const SocketContext = React.createContext<SocketContextType | undefined>(undefined)

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
