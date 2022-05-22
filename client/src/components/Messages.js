import React from "react"
import { useRoom, useSocket } from "App"
import { Form, ListGroup, ListGroupItem } from "react-bootstrap"

export function MessagesWrapper() {
  return (
    <div className="p-3 d-flex flex-column flex-grow-1">
      <Messages />
      <MessageInput />
    </div>
  )
}

function Messages() {
  const { room } = useRoom()
  const messages = room.get("messages")
  const ref = React.useRef()

  React.useEffect(() => {
    if (messages.size > 3) {
      ref?.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.size])

  return (
    <>
      <div className="overflow-auto" style={{ flex: "1 1 7em" }}>
        <ListGroup className="mt-auto">
          {[...messages]
            .sort((a, b) => a.time - b.time)
            .map((message) => (
              <ListGroupItem key={message.id}>
                <div className="d-flex justify-content-between small">
                  <strong>{message.user.name}</strong>
                  <small className="text-muted">
                    {new Date(message.time).toLocaleTimeString()}
                  </small>
                </div>
                <span className="text-secondary">{message.value}</span>
              </ListGroupItem>
            ))}
          <div ref={ref}></div>
        </ListGroup>
      </div>
    </>
  )
}

const MessageInput = () => {
  const inputRef = React.useRef()
  const { socket } = useSocket()

  const submitForm = (e) => {
    e.preventDefault()
    const value = inputRef.current.value.trim()
    if (value) {
      socket.emit("message", value)
    }
    e.target.reset()
  }

  return (
    <Form onSubmit={submitForm} className="mt-auto">
      <Form.Control ref={inputRef} placeholder="Type your message" />
    </Form>
  )
}
