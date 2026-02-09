import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast, type Id } from "react-toastify"

const IDLE_TIME = 1000 * 2 * 60 // 2 minutes
const REDIRECT_TIME = 1000 * 30 // 30 seconds

export const useIdle = (): void => {
  const idleTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const redirectTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const toastId = React.useRef<Id | undefined>(undefined)
  const navigate = useNavigate()

  const warning =
    "You there? If not you will be redirected to the homepage in 30 seconds."

  const handleIdle = React.useCallback(() => {
    toastId.current = toast.warn(warning, {
      onOpen: () => {
        redirectTimeout.current = setTimeout(() => {
          navigate("/")
          if (toastId.current) toast.dismiss(toastId.current)
        }, REDIRECT_TIME)
      },
      toastId: "idle-toast"
    })
  }, [navigate])

  const resetTimers = React.useCallback(() => {
    if (idleTimeout.current) clearTimeout(idleTimeout.current)
    if (redirectTimeout.current) clearTimeout(redirectTimeout.current)
    if (toastId.current) toast.dismiss(toastId.current)

    idleTimeout.current = setTimeout(handleIdle, IDLE_TIME)
  }, [handleIdle])

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "touchstart", "click"]
    
    const activityHandler = () => resetTimers()

    events.forEach(event => {
      window.addEventListener(event, activityHandler)
    })

    idleTimeout.current = setTimeout(handleIdle, IDLE_TIME)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler)
      })
      if (idleTimeout.current) clearTimeout(idleTimeout.current)
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current)
    }
  }, [handleIdle, resetTimers])
}
