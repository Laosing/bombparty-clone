import MockedSocket from "socket.io-mock"
import { deserialize } from "functions/deserialize"
import { RoomContext } from "hooks/useRoom"
import { SocketContext } from "hooks/useSocket"
import { roomDefaultData, roomWithWinnerData } from "./fixtures"

export const roomDefault = deserialize(roomDefaultData)
export const roomWithWinner = deserialize(roomWithWinnerData)

export const _roomId = "TEST"
export const _userId = "l17oMihmvHzmZFYyVrSFo"
const _socket = new MockedSocket()

export const roomWrapper = (room, roomId = _roomId) => {
  return ({ children }) => (
    <RoomContext.Provider value={{ room, roomId }}>
      {children}
    </RoomContext.Provider>
  )
}

export const socketWrapper = (
  component,
  value = { socket: _socket, userId: _userId }
) => {
  return (
    <SocketContext.Provider value={value}>{component}</SocketContext.Provider>
  )
}
