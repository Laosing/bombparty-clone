import { useSocket } from "App"
import React from "react"

const NewMessage = () => {
  const inputRef = React.useRef()
  const { socket } = useSocket()

  const submitForm = (e) => {
    e.preventDefault()
    const value = inputRef.current.value.toLowerCase().trim()
    if (value) {
      socket.emit("message", value)
    }
    e.target.reset()
  }

  return (
    <form onSubmit={submitForm}>
      <input ref={inputRef} placeholder="Type your message" />
    </form>
  )
}

export default NewMessage
