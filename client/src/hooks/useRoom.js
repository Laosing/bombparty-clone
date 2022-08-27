import React from "react"

export const RoomContext = React.createContext()
export const useRoom = () => React.useContext(RoomContext)
