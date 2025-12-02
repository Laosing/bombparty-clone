import React from "react"
import { Link, useParams } from "react-router-dom"
import Button from "react-bootstrap/Button"
import { LayoutWithHeader } from "components/Layout"
import { InitializeRoom } from "components/InitializeRoom"

export function ValidateRoom() {
  const { roomId } = useParams<{ roomId: string }>()
  const validRoomId = roomId && roomId.match(/^[A-Z]*$/) && roomId.length === 4

  if (!validRoomId) {
    return (
      <LayoutWithHeader>
        <h1 className="h3 mb-3">Invalid room</h1>
        <Button
          as={Link as any}
          to="/"
        >
          Back to home
        </Button>
      </LayoutWithHeader>
    )
  }

  return <InitializeRoom />
}
