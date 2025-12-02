import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast, Id } from "react-toastify"
import createActivityDetector from "activity-detector"

export const useIdle = (): void => {
  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const toastId = React.useRef<Id | undefined>(undefined)
  const navigate = useNavigate()

  const activityDetector = React.useMemo(() => {
    const detector = createActivityDetector({
      timeToIdle: 1000 * 60 * 5,
      inactivityEvents: []
    })
    const warning =
      "You there? If not you will be redirected to the homepage in 30 seconds."
    const onOpen = () => {
      timeout.current = setTimeout(() => {
        navigate("/")
        if (toastId.current) toast.dismiss(toastId.current)
      }, 1000 * 30)
    }

    const onIdle = () => {
      toastId.current = toast.warn(warning, { onOpen, toastId: "idle-toast" })
    }
    const onActive = () => {
      if (timeout.current) clearTimeout(timeout.current)
      if (toastId.current) toast.dismiss(toastId.current)
    }
    detector.on("idle", onIdle)
    detector.on("active", onActive)

    return detector
  }, [navigate])

  useEffect(() => {
    return () => activityDetector.stop()
  }, [activityDetector])
}
