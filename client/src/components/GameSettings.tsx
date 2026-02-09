import React, { useEffect, useState } from "react"
import { deserialize } from "functions/deserialize"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { HardmodeTooltip } from "components/HardmodeTooltip"
import { isDevEnv } from "functions/session"
import { User } from "types/index"

export function GameSettings() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const users = room.get("users") as Map<string, User>
  const running = room.get("running")
  const isCountDown = room.get("isCountDown")
  const settings = room.get("settings")
  const lives = settings.get("lives")
  const timer = settings.get("timer")
  const letterBlendCounter = settings.get("letterBlendCounter")
  const hardMode = settings.get("hardMode")
  const hardModeEnabled = settings.get("hardModeEnabled")

  const canEditSettings = !Boolean(
    Array.from(users).find(([id, val]) => val.inGame && id === userId),
  )

  const disabled = running || canEditSettings || isCountDown

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    if (disabled) return
    e.preventDefault()
    var formData = new FormData(e.currentTarget)
    const lives = formData.get("lives")
    const timer = formData.get("timer")
    const letterBlendCounter = formData.get("letterBlendCounter")
    const hardMode = formData.get("hardMode")
    const hardModeEnabled = Boolean(formData.get("hardModeEnabled"))
    const data = {
      lives,
      timer,
      letterBlendCounter,
      hardMode,
      hardModeEnabled,
    }
    socket.emit("setSettings", data, userId)
  }

  const [notification, setNotification] = useState(false)

  const [formValues, setFormValues] = useState({
    timer,
    lives,
    letterBlendCounter,
    hardMode,
    hardModeEnabled,
  })

  useEffect(() => {
    const triggerValidation = (val: string) => {
      const s = deserialize<Map<string, any>>(val)
      setFormValues({
        timer: s.get("timer"),
        lives: s.get("lives"),
        letterBlendCounter: s.get("letterBlendCounter"),
        hardMode: s.get("hardMode"),
        hardModeEnabled: s.get("hardModeEnabled"),
      })
      setNotification(true)
      setTimeout(() => setNotification(false), 500)
    }

    socket.on("setSettings", triggerValidation)
    return () => {
      socket.off("setSettings", triggerValidation)
    }
  }, [socket])

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormValues((prev) => ({ ...prev, [field]: Number(e.target.value) }))

  return (
    <form onSubmit={submitForm} className="px-4 flex flex-col gap-1">
      <div className="form-control w-full">
        <label className="label py-1" htmlFor="timer">
          <span className="label-text">
            Timer: <strong>{formValues.timer}s</strong>
          </span>
        </label>
        <input
          type="range"
          id="timer"
          name="timer"
          min={isDevEnv ? 1 : 10}
          max={59}
          step={1}
          value={formValues.timer}
          disabled={disabled}
          onChange={updateField("timer")}
          className="range range-primary range-xs"
        />
      </div>

      <div className="form-control w-full">
        <label className="label py-1" htmlFor="lives">
          <span className="label-text">
            Lives: <strong>{formValues.lives}</strong>
          </span>
        </label>
        <input
          type="range"
          id="lives"
          name="lives"
          min={1}
          max={10}
          step={1}
          value={formValues.lives}
          disabled={disabled}
          onChange={updateField("lives")}
          className="range range-primary range-xs"
        />
      </div>

      <div className="form-control w-full">
        <label className="label py-1" htmlFor="letterBlendCounter">
          <span className="label-text">
            Change letters after <strong>{formValues.letterBlendCounter}</strong> turns
          </span>
        </label>
        <input
          type="range"
          id="letterBlendCounter"
          name="letterBlendCounter"
          min={1}
          max={10}
          step={1}
          value={formValues.letterBlendCounter}
          disabled={disabled}
          onChange={updateField("letterBlendCounter")}
          className="range range-primary range-xs"
        />
      </div>

      <div className="form-control w-full">
        <label
          className="label cursor-pointer justify-start gap-4 mb-2 flex-wrap"
          htmlFor="hardModeEnabled"
        >
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={Boolean(formValues.hardModeEnabled)}
            onChange={() => setFormValues((prev) => ({ ...prev, hardModeEnabled: !prev.hardModeEnabled }))}
            name="hardModeEnabled"
            id="hardModeEnabled"
            disabled={disabled}
          />
          <span
            className={`label-text transition-opacity ${formValues.hardModeEnabled ? "opacity-100" : "opacity-50"}`}
          >
            Hard mode after <strong>{formValues.hardMode}</strong> rounds{" "}
            <HardmodeTooltip />
          </span>
        </label>

        <input
          type="range"
          name="hardMode"
          min={1}
          max={10}
          step={1}
          value={formValues.hardMode}
          disabled={disabled || !formValues.hardModeEnabled}
          onChange={updateField("hardMode")}
          className={`range range-primary range-xs transition-opacity ${formValues.hardModeEnabled ? "opacity-100" : "opacity-30"}`}
        />
      </div>

      <button
        type="submit"
        className={`btn btn-sm w-full mt-2 ${notification ? "btn-success" : "btn-neutral"}`}
        disabled={disabled}
      >
        {notification ? "Updated!" : "Change settings"}
      </button>
    </form>
  )
}
