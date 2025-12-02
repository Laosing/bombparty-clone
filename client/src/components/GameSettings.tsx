import React, { useEffect, useState } from "react"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import Row from "react-bootstrap/Row"
import Stack from "react-bootstrap/Stack"
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
    Array.from(users).find(([id, val]) => val.inGame && id === userId)
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
    const data = { lives, timer, letterBlendCounter, hardMode, hardModeEnabled }
    socket.emit("setSettings", data, userId)
  }

  const [notification, setNotification] = useState(false)

  const [timerValue, setTimerValue] = useState(timer)
  const [livesValue, setLivesValue] = useState(lives)
  const [lettersValue, setLettersValue] = useState(letterBlendCounter)
  const [hardModeValue, setHardModeValue] = useState(hardMode)
  const [hardModeToggle, setHardModeToggle] = useState(hardModeEnabled)

  useEffect(() => {
    const triggerValidation = (val: string) => {
      const deserializedVal = deserialize<Map<string, any>>(val)
      setTimerValue(deserializedVal.get("timer"))
      setLivesValue(deserializedVal.get("lives"))
      setLettersValue(deserializedVal.get("letterBlendCounter"))
      setHardModeToggle(deserializedVal.get("hardModeEnabled"))
      setNotification(Boolean(deserializedVal))
      setTimeout(() => setNotification(false), 500)
    }

    socket.on("setSettings", triggerValidation)
    return () => {
      socket.off("setSettings", triggerValidation)
    }
  }, [socket])

  return (
    <>
      <Form
        onSubmit={submitForm}
        className="p-3"
      >
        <Row>
          <Stack gap={2}>
            <Form.Group controlId="timer">
              <Form.Label className="mb-0">
                Timer: <strong>{timerValue}s</strong>
              </Form.Label>
              <Form.Range
                key={`form-timer-${timer}`}
                name="timer"
                defaultValue={String(timer)}
                min={isDevEnv ? "1" : "10"}
                max="59"
                step="1"
                disabled={disabled}
                onChange={(e) => setTimerValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="lives">
              <Form.Label className="mb-0">
                Lives: <strong>{livesValue}</strong>
              </Form.Label>
              <Form.Range
                key={`form-lives-${lives}`}
                name="lives"
                defaultValue={lives}
                min="1"
                max="10"
                step="1"
                disabled={disabled}
                onChange={(e) => setLivesValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="letterBlendCounter">
              <Form.Label className="mb-0">
                Change letters after <strong>{lettersValue}</strong> turns
              </Form.Label>
              <Form.Range
                key={`form-letterBlendCounter-${letterBlendCounter}`}
                name="letterBlendCounter"
                defaultValue={letterBlendCounter}
                min="1"
                max="10"
                step="1"
                disabled={disabled}
                onChange={(e) => setLettersValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="hardMode">
              <Form.Check
                type="switch"
                checked={Boolean(hardModeToggle)}
                onChange={() => setHardModeToggle((p: boolean) => !p)}
                label=""
                className="d-inline-block"
                name="hardModeEnabled"
                id="hardModeEnabled"
                disabled={disabled}
              />
              <Form.Label
                className="mb-0"
                style={{ opacity: hardModeToggle ? 1 : 0.5 }}
              >
                Hard mode after <strong>{hardModeValue}</strong> rounds{" "}
                <HardmodeTooltip />
              </Form.Label>
              <Form.Range
                key={`form-hardMode-${hardMode}`}
                name="hardMode"
                defaultValue={hardMode}
                min="1"
                max="10"
                step="1"
                disabled={disabled || !hardModeToggle}
                onChange={(e) => setHardModeValue(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex align-items-end">
              <Button
                type="submit"
                variant={notification ? "success" : "secondary"}
                className="w-100"
                disabled={disabled}
                size="sm"
              >
                {notification ? "Updated!" : "Change settings"}
              </Button>
            </div>
          </Stack>
        </Row>
      </Form>
    </>
  )
}
