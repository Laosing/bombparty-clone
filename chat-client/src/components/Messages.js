import React from "react"
import { useRoom } from "App"

function Messages() {
  const { room } = useRoom()
  const messages = room.get("messages")

  return (
    <div style={{ textAlign: "left" }}>
      {[...messages]
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

export default Messages
