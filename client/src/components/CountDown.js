import React, { useEffect, useState } from "react"
import soundCountDown from "audio/beep.mp3"
import soundCountDownEnd from "audio/beep-end.mp3"
import { useSocket } from "hooks/useSocket"
import { useHowl } from "hooks/useHowl"

export function CountDown({ isCountDown }) {
  const { socket } = useSocket()
  const [countDown, setCountDown] = useState()
  const [audioCountDown] = useHowl(soundCountDown)
  const [audioCountDownEnd] = useHowl(soundCountDownEnd)

  useEffect(() => {
    const triggerCountDown = (val) => {
      setCountDown(val)
      if (typeof val === "number") {
        val === 0 ? audioCountDownEnd.play() : audioCountDown.play()
      }
    }
    socket.on("startCountDown", triggerCountDown)
    return () => {
      socket.off("startCountDown", triggerCountDown)
    }
  }, [audioCountDown, audioCountDownEnd, socket])

  if (!isCountDown || typeof countDown !== "number") {
    return null
  }

  return (
    <div className="py-5">
      <div>The game starts in</div>
      <div className="h1">{countDown}</div>
    </div>
  )
}
