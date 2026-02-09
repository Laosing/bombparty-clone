import { useEffect, useRef, useState } from "react"
import { useSocket } from "./useSocket"

export const useEventTimeout = <T>(event: string, initialValue: T, timeout: number = 300): [T] => {
  const { socket } = useSocket()
  const [state, setState] = useState<T>(initialValue)
  const initialValueRef = useRef(initialValue)
  initialValueRef.current = initialValue

  useEffect(() => {
    const triggerEvent = (data: T) => {
      setState(data)
      setTimeout(() => setState(initialValueRef.current), timeout)
    }

    socket.on(event, triggerEvent)
    return () => {
      socket.off(event, triggerEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, socket, timeout])

  return [state]
}

export function useWordValidation(timeout: number = 300, callback?: (isValid: boolean) => void) {
  const [validation, setValidation] = useState<Record<string, any>>({})
  const { socket } = useSocket()

  useEffect(() => {
    const triggerValidation = (isValid: boolean, data: any) => {
      setValidation({ isValid, ...data })
      if (typeof callback === "function") callback(isValid)
      setTimeout(() => setValidation({}), timeout)
    }

    socket.on("wordValidation", triggerValidation)
    return () => {
      socket.off("wordValidation", triggerValidation)
    }
  }, [callback, socket, timeout])

  return validation
}
