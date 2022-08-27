import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button, Form, InputGroup, FormControl } from "react-bootstrap"
import { getRoomId } from "functions/session"
import { LayoutWithHeader } from "components/Layout"
import { Rooms } from "components/Rooms"

export const Home = () => {
  const navigate = useNavigate()
  const onSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const room = formData.get("room").toUpperCase()
    navigate(room)
  }

  const [isPrivate, setIsPrivate] = useState(false)
  const toggle = () => setIsPrivate((p) => !p)

  return (
    <LayoutWithHeader className="pb-5">
      <h1 className="display-3">Welcome to 💣party!</h1>
      <p className="mb-5">Create or join a room to get started</p>
      <Button
        size="lg"
        as={Link}
        to={getRoomId()}
        className="mb-1"
        state={{ isPrivate }}
      >
        Create room
      </Button>
      <Form.Check
        id="private-room"
        checked={isPrivate}
        onChange={toggle}
        label="Private room"
        className="d-flex gap-2 justify-content-center mb-5"
      />
      <Form onSubmit={onSubmit} className="mb-5">
        <Form.Label htmlFor="existing-room">
          Know an existing room? Enter it here!
        </Form.Label>
        <InputGroup className="w-auto justify-content-center">
          <FormControl
            id="existing-room"
            className="text-uppercase"
            name="room"
            style={{ maxWidth: "120px" }}
          />
          <Button type="submit" variant="outline-secondary">
            Join
          </Button>
        </InputGroup>
      </Form>
      <Rooms />
    </LayoutWithHeader>
  )
}
