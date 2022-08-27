import React, { useEffect, useState } from "react"
import { Form, ListGroup, ListGroupItem } from "react-bootstrap"
import { deserialize } from "functions/deserialize"
import { useSocket } from "hooks/useSocket"

export function MessagesWrapper() {
  return (
    <div className="p-3 d-flex flex-column flex-grow-1">
      <Messages />
      <MessageInput />
    </div>
  )
}

function Messages() {
  const { socket } = useSocket()
  const ref = React.useRef()

  const [messages, setMessages] = useState(new Set())
  const [notify, setNotify] = useState(false)

  useEffect(() => {
    const updateMessages = (val) => setMessages(deserialize(val))
    socket.emit("getMessages")
    socket.on("messages", updateMessages)
    return () => {
      socket.off("messages", updateMessages)
    }
  }, [socket])

  useEffect(() => {
    if (ref?.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
    setNotify(true)
    setTimeout(() => {
      setNotify(false)
    }, 300)
  }, [messages.size])

  return (
    <>
      <div className="overflow-auto" style={{ flex: "1 1 7em" }} ref={ref}>
        <ListGroup className="mt-auto">
          {[...messages]
            .sort((a, b) => a.time - b.time)
            .map((message, index, array) => (
              <ListGroupItem
                key={message.id}
                style={{
                  transition: "box-shadow .3s ease",
                  ...(notify &&
                    index === array.length - 1 && {
                      boxShadow: "inset 0 0 0 1px var(--bs-danger)"
                    })
                }}
              >
                {message.user.name ? (
                  <>
                    <div className="d-flex justify-content-between small">
                      <strong>{message.user.name}</strong>
                      <small className="text-muted flex-shrink-0">
                        {new Date(message.time).toLocaleTimeString()}
                      </small>
                    </div>
                    <small className="text-secondary">{message.value}</small>
                  </>
                ) : (
                  <div className="d-flex justify-content-between small">
                    <span className="text-secondary">🚨 {message.value}</span>
                    <small className="text-muted flex-shrink-0">
                      {new Date(message.time).toLocaleTimeString()}
                    </small>
                  </div>
                )}
              </ListGroupItem>
            ))}
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
