import React, { useContext } from "react"

export const SocketContext = React.createContext()
export const useSocket = () => useContext(SocketContext)
