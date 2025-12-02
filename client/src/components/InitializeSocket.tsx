import React, { useEffect, useState } from "react"
import io, { Socket } from "socket.io-client"
import { deserialize } from "functions/deserialize"
import { log, isDevEnv } from "functions/session"
import { useGameStore } from "hooks/useStore"
import { SocketContext } from "hooks/useSocket"
import { LayoutWithHeader } from "components/Layout"

interface InitializeSocketProps {
    children: React.ReactNode;
}

export const InitializeSocket = ({ children }: InitializeSocketProps) => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined)
  const userId = useGameStore((state) => state.userId)

  useEffect(() => {
    if (!socket) {
      const logger = (event: string, ...args: any[]) => {
        log(
          "%c" + event,
          "color: pink;",
          event === "getRoom" ? deserialize(args[0]) : args
        )
      }

      const params = {
        auth: { userId },
        upgrade: false,
        transports: ["websocket"],
      }
      const props = isDevEnv
        ? [`http://${window.location.hostname}:8080`, params] as const
        : [params] as const

      // @ts-ignore - io spread arguments issue
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

  // @ts-ignore - SocketContextType expects { socket }. Here we are passing { socket, userId }?
  // In useSocket.ts I defined it as { socket }.
  // If I want userId to be part of context, I should update useSocket.ts.
  // BUT userId is available globally via useGameStore.
  // Maybe previous code passed it for convenience?
  // Let's update useSocket.ts to include userId just in case components rely on it from there.
  return (
    // @ts-ignore
    <SocketContext.Provider value={{ socket, userId }}>
      {children}
    </SocketContext.Provider>
  )
}
