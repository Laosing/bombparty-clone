import React, { useEffect, useState } from "react"
import { useSocket } from "./useSocket"

export const useBoomTimeout = <T>(event: string, timeout: number = 3000): [T[], () => void] => {
  const { socket } = useSocket()
  const [state, setState] = useState<T[]>([])
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>()

  const resetState = React.useCallback(() => {
    if (timer) clearTimeout(timer)
    setState([])
    setTimer(undefined)
  }, [timer])

  useEffect(() => {
    const triggerEvent = (data: T[]) => {
      if (timer) clearTimeout(timer)
      setState(data)
      setTimer(setTimeout(() => setState([]), timeout))
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, socket, timeout]) // Removing timer from dependency array to avoid loop

  return [state, resetState]
}
