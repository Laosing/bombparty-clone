import { useEffect, useState } from "react"
import { useSocket } from "./useSocket"

export const useEventTimeout = (event, initialValue, timeout = 300) => {
  const { socket } = useSocket()
  const [state, setState] = useState(initialValue)

  useEffect(() => {
    const triggerEvent = (data) => {
      setState(data)
      setTimeout(() => setState(initialValue), timeout)
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
  }, [event, initialValue, socket, timeout])

  return [state]
}
export function useWordValidation(timeout = 300, callback) {
  const [validation, setValidation] = useState({})
  const { socket } = useSocket()

  useEffect(() => {
    const triggerValidation = (isValid, data) => {
      setValidation({ isValid, ...data })
      typeof callback === "function" && callback(isValid)
      setTimeout(() => setValidation({}), timeout)
    }

    socket.on("wordValidation", triggerValidation)
    return () => {
      socket.off("wordValidation", triggerValidation)
    }
  }, [callback, socket, timeout])

  return validation
}
