import React, { useEffect, useState } from "react"
import { Button, Form, Row, Stack } from "react-bootstrap"
import { deserialize } from "functions/deserialize"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { HardmodeTooltip } from "components/HardmodeTooltip"

export function GameSettings() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const users = room.get("users")
  const running = room.get("running")
  const isCountDown = room.get("isCountDown")
  const settings = room.get("settings")
  const lives = settings.get("lives")
  const timer = settings.get("timer")
  const letterBlendCounter = settings.get("letterBlendCounter")
  const hardMode = settings.get("hardMode")
  const hardModeEnabled = settings.get("hardModeEnabled")

  const canEditSettings = !Boolean(
    [...users].find(([id, val]) => val.inGame && id === userId)
  )

  const disabled = running || canEditSettings || isCountDown

  const submitForm = (e) => {
    if (disabled) return
    e.preventDefault()
    var formData = new FormData(e.target)
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
    const triggerValidation = (val) => {
      val = deserialize(val)
      setTimerValue(val.get("timer"))
      setLivesValue(val.get("lives"))
      setLettersValue(val.get("letterBlendCounter"))
      setHardModeToggle(val.get("hardModeEnabled"))
      setNotification(Boolean(val))
      setTimeout(() => setNotification(false), 500)
    }

    socket.on("setSettings", triggerValidation)
    return () => {
      socket.off("setSettings", triggerValidation)
    }
  }, [socket])

  return (
    <>
      <Form onSubmit={submitForm} className="p-3">
        <Row>
          <Stack gap={2}>
            {/* <Form.Check
              type="switch"
              checked={!!true}
              onChange={() => {}}
              label="Show Timer"
            /> */}
            <Form.Group controlId="timer">
              <Form.Label className="mb-0">
                Timer: <strong>{timerValue}s</strong>
              </Form.Label>
              <Form.Range
                key={`form-timer-${timer}`}
                name="timer"
                defaultValue={String(timer)}
                min="1"
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
                type="number"
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
                type="number"
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
                onChange={() => setHardModeToggle((p) => !p)}
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
                type="number"
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
