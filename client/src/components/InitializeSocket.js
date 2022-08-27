import React, { useEffect, useState } from "react"
import io from "socket.io-client"
import { deserialize } from "functions/deserialize"
import { log, isDevEnv } from "functions/session"
import { useGameStore } from "hooks/useStore"
import { SocketContext } from "hooks/useSocket"
import { LayoutWithHeader } from "components/Layout"

export const InitializeSocket = ({ children }) => {
  const [socket, setSocket] = useState(undefined)
  const userId = useGameStore((state) => state.userId)

  useEffect(() => {
    if (!socket) {
      const logger = (event, ...args) => {
        log(
          "%c" + event,
          "color: pink;",
          event === "getRoom" ? deserialize(args) : args
        )
      }

      const params = { auth: { userId } }
      const props = isDevEnv
        ? [`http://${window.location.hostname}:8080`, params]
        : [params]

      const newSocket = io(...props)
      setSocket(newSocket)
      log("setting socket!", newSocket)

      newSocket.onAny(logger)
      return () => {
        log("closing!")
        newSocket.offAny(logger)
        newSocket.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!socket) {
    return (
      <LayoutWithHeader>
        <h1 className="h3">Not Connected, try refreshing</h1>
      </LayoutWithHeader>
    )
  }

  return (
    <SocketContext.Provider value={{ socket, userId }}>
      {children}
    </SocketContext.Provider>
  )
}
