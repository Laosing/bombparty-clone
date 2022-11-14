import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { Container, Button, Row, Col, ListGroup } from "react-bootstrap"
import clsx from "clsx"
import { useGameStore } from "hooks/useStore"
import { useSocket } from "hooks/useSocket"
import { useRoom } from "hooks/useRoom"
import { useIdle } from "hooks/useIdle"
import { MessagesWrapper } from "components/Messages"
import { PrivateTooltip } from "components/PrivateTooltip"
import { Hr } from "components/Hr"
import { Game } from "components/Game"
import { EditName } from "components/EditName"
import { AvatarSettings } from "components/AvatarSettings"
import { Layout } from "components/Layout"
import { AudioSettings } from "components/AudioSettings"
import { GameSettings } from "components/GameSettings"
import { GithubLink } from "components/GithubLink"
import { reset } from "functions/reset"

export function Room() {
  const { socket } = useSocket()
  const { roomId, room } = useRoom()
  const theme = useGameStore((state) => state.theme)
  const isPrivate = room.get("private")
  const isAdmin = useGameStore((state) => state.isAdmin)

  const resetClient = () => socket.emit("resetClient")

  useEffect(() => {
    socket.on("resetClient", reset)
    return () => {
      socket.off("resetClient", reset)
    }
  }, [socket])

  useIdle()

  return (
    <>
      <Container fluid className={clsx("d-flex flex-grow-1", theme)}>
        {isAdmin && (
          <Button
            variant="link"
            onClick={resetClient}
            className="position-absolute top-0 end-0 text-decoration-none border-0"
          >
            ☠️
          </Button>
        )}
        <Row className="flex-grow-1">
          <Col md={8} className="position-relative">
            <GithubLink />
            <Layout className="p-0">
              <Game />
            </Layout>
          </Col>
          <Col md={4} className={clsx("p-0 d-flex flex-column sidebar")}>
            <div className="p-3 pb-0 text-center">
              <AvatarSettings />
              <EditName />
            </div>
            <ListGroup className="p-3">
              <ListGroup.Item className="d-flex justify-content-between align-items-center p-2">
                <span>
                  Current room: <strong>{roomId}</strong>{" "}
                  {isPrivate && <PrivateTooltip />}
                </span>
                <Button as={Link} to="/" size="sm" variant="danger">
                  Leave room
                </Button>
              </ListGroup.Item>
            </ListGroup>
            <Hr />
            <AudioSettings />
            <Hr />
            <GameSettings />
            <Hr />
            <MessagesWrapper />
          </Col>
        </Row>
      </Container>
    </>
  )
}
