import React from "react"
import MockedSocket from "socket.io-mock"
import { deserialize } from "functions/deserialize"
import { RoomContext } from "hooks/useRoom"
import { SocketContext, SocketContextType } from "hooks/useSocket"
import { roomDefaultData, roomWithWinnerData } from "./fixtures"

export const roomDefault = deserialize<any>(roomDefaultData)
export const roomWithWinner = deserialize<any>(roomWithWinnerData)

export const _roomId = "TEST"
export const _userId = "l17oMihmvHzmZFYyVrSFo"
// @ts-ignore
const _socket = new MockedSocket()

interface WrapperProps {
    children: React.ReactNode;
}

export const roomWrapper = (room: any, roomId = _roomId) => {
  return ({ children }: WrapperProps) => (
    <RoomContext.Provider value={{ room, roomId }}>
      {children}
    </RoomContext.Provider>
  )
}

export const socketWrapper = (
  component: React.ReactNode,
  value: SocketContextType = { socket: _socket as any, userId: _userId }
) => {
  return (
    <SocketContext.Provider value={value}>{component}</SocketContext.Provider>
  )
}
