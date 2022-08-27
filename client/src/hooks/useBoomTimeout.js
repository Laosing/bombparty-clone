import React, { useEffect, useState } from "react"
import { useSocket } from "./useSocket"

export const useBoomTimeout = (event, timeout = 3000) => {
  const { socket } = useSocket()
  const [state, setState] = useState([])
  const [timer, setTimer] = useState()

  const resetState = React.useCallback(() => {
    clearTimeout(timer)
    setState([])
    setTimer()
  }, [timer])

  useEffect(() => {
    const triggerEvent = (data) => {
      clearTimeout(timer)
      setState(data)
      setTimer(setTimeout(() => setState([]), timeout))
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
  }, [event, socket, timeout, timer])

  return [state, resetState]
}
