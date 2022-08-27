import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import createActivityDetector from "activity-detector"

export const useIdle = () => {
  const timeout = React.useRef()
  const toastId = React.useRef()
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
        toast.dismiss(toastId.current)
      }, 1000 * 30)
    }

    const onIdle = () => {
      toastId.current = toast.warn(warning, { onOpen, toastId: "idle-toast" })
    }
    const onActive = () => {
      clearTimeout(timeout.current)
      toast.dismiss(toastId.current)
    }
    detector.on("idle", onIdle)
    detector.on("active", onActive)

    return detector
  }, [navigate])

  useEffect(() => {
    return () => activityDetector.stop()
  }, [activityDetector])
}
