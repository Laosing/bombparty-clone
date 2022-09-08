import React, { useEffect, useState, useDeferredValue } from "react"
import { Form, Badge } from "react-bootstrap"
import clsx from "clsx"
import { LETTER_BONUS } from "constants/constants"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { useWordValidation, useEventTimeout } from "hooks/useEventTimeout"

export function PlayerInput() {
  const { socket, userId } = useSocket()
  const { room } = useRoom()

  const [value, setValue] = useState("")
  const deferredValue = useDeferredValue(value)

  const validation = useWordValidation(500)

  const [bonusLetter] = useEventTimeout("bonusLetter", "", 1000)

  const currentGroup = room.get("currentGroup")
  const groups = room.get("groups")

  const group = groups.get(currentGroup)
  const isCurrentGroup = group?.members?.has?.(userId)
  const index = [...(group?.members || [])].findIndex((id) => id === userId)
  const isActiveTyper = group?.activeTyper % group?.members?.size === index

  const submitForm = (e) => {
    e.preventDefault()
    socket.emit("checkWord", value, currentGroup)
    e.target.reset()
  }

  const onChange = (e) => {
    const val = e.target.value.toLowerCase()
    setValue(val)
    socket.emit("setGlobalInputText", val)
  }

  const color =
    validation.isValid === false
      ? "animate__animated animate__shakeX animate__faster border-danger"
      : validation.isValid
      ? "border-success"
      : ""

  const errorReason =
    validation.isUnique === false
      ? "Already used!"
      : validation.isDictionary === false
      ? "Not in my dictionary!"
      : validation.isBlend === false
      ? "Missing the letters above"
      : ""

  useEffect(() => {
    setValue("")
    socket.emit("setGlobalInputText", "")
  }, [currentGroup, isActiveTyper, socket])

  useEffect(() => {
    socket.on("setGlobalInputText", setValue)
    return () => {
      socket.off("setGlobalInputText", setValue)
    }
  }, [socket])

  const inputProps = {
    disabled: !isCurrentGroup || !isActiveTyper,
    ...((!isCurrentGroup || !isActiveTyper) && { value: deferredValue }),
    ...(isCurrentGroup && isActiveTyper && { onChange: onChange })
  }

  return (
    <>
      <Form
        onSubmit={submitForm}
        className="d-flex justify-content-center mt-1 mb-2 flex-column m-auto position-relative"
        style={{ maxWidth: "20em" }}
      >
        <Form.Control
          className={clsx(color)}
          key={`${currentGroup}_${isActiveTyper}`}
          autoFocus
          {...inputProps}
        />
        {deferredValue && (
          <Badge
            bg={
              deferredValue.length > LETTER_BONUS
                ? "warning text-dark"
                : "secondary"
            }
            className="position-absolute top-50 end-0 translate-middle-y me-2"
          >
            {deferredValue.length}
          </Badge>
        )}
        {bonusLetter && (
          <Badge
            bg="warning text-dark"
            className="position-absolute top-100 start-50"
            style={{
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: "1em"
            }}
          >
            {bonusLetter.toUpperCase()}
          </Badge>
        )}
        {errorReason && (
          <Badge
            bg="danger"
            className="position-absolute top-100 start-50"
            style={{
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontSize: "1em"
            }}
          >
            {errorReason}
          </Badge>
        )}
      </Form>
    </>
  )
}
