import React from "react"
import { useRoom } from "App"

function Messages() {
  const { room } = useRoom()
  const messages = room.get("messages")

  return (
    <div className="message-list">
      {[...messages]
        .sort((a, b) => a.time - b.time)
        .map((message) => (
          <div
            key={message.id}
            className="message-container"
            title={`Sent at ${new Date(message.time).toLocaleTimeString()}`}
          >
            <span className="user">{message.user.name}:</span>
            <span className="message">{message.value}</span>
            <span className="date">
              {new Date(message.time).toLocaleTimeString()}
            </span>
          </div>
        ))}
    </div>
  )
}

export default Messages
