import React from "react"
import { Button } from "react-bootstrap"
import { shallow } from "zustand/shallow"
import { getRandomName } from "functions/session"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"

export function EditName() {
  const { socket } = useSocket()

  const [name, setName, userId] = useGameStore(
    (state) => [state.name, state.setName, state.userId],
    shallow
  )

  const editName = () => {
    const namePrompt = window.prompt(
      "Name: (over 30 characters or blank will generate a random name)"
    )
    if (namePrompt !== null) {
      const validName = namePrompt.trim().length < 30 && namePrompt.trim()
      const newName = validName ? namePrompt.trim() : getRandomName()
      setName(newName)
      socket.emit("updateName", newName, userId)
    }
  }

  return (
    <div className="h5 mb-0 d-flex justify-content-center align-items-center">
      <div className="position-relative">
        {name}
        <Button
          style={{ transform: "translate(0, -50%)" }}
          className="text-decoration-none position-absolute top-50 start-100"
          onClick={editName}
          size="sm"
          variant="link"
          title="Edit name"
        >
          ✏️
        </Button>
      </div>
    </div>
  )
}
