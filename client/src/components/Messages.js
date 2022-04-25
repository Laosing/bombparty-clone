import React from "react"
import { useRoom, useSocket } from "App"

export function MessagesWrapper() {
  return (
    <div
      style={{
        textAlign: "left",
        border: "1px solid black",
        maxWidth: "400px",
        margin: "auto"
      }}
    >
      <Messages />
      <MessageInput />
    </div>
  )
}

function Messages() {
  const { room } = useRoom()
  const messages = room.get("messages")

  const roomMessages = [...messages]

  return (
    <div style={{ padding: "1rem" }}>
      <h4 style={{ margin: 0 }}>chat box</h4>
      {roomMessages
        .sort((a, b) => a.time - b.time)
        .map((message) => (
          <div
            key={message.id}
            title={`Sent at ${new Date(message.time).toLocaleTimeString()}`}
          >
            <span>
              <small>{new Date(message.time).toLocaleTimeString()}</small>
              {" : "}
              {message.user.name}
              {" - "}
            </span>{" "}
            <span>{message.value}</span>{" "}
          </div>
        ))}
    </div>
  )
}

const MessageInput = () => {
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
      <input
        style={{
          width: "100%",
          border: 0,
          borderTop: "1px solid black",
          padding: "1rem"
        }}
        ref={inputRef}
        placeholder="Type your message"
      />
    </form>
  )
}
