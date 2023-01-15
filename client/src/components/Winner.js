import React from "react"
import { Row, Col, Badge } from "react-bootstrap"
import confetti from "canvas-confetti"
import { useRoom } from "hooks/useRoom"
import { Highlight } from "components/Highlight"
import { Avatar } from "components/Avatar"

export function Winner({ winner }) {
  const { room } = useRoom()
  const users = room.get("users")
  const round = room.get("round")
  const hardMode = room.get("hardMode")
  const roomLetterBlendWord = room.get("letterBlendWord")
  const roomLetterBlend = room.get("letterBlend")

  const ref = React.useRef()
  const refCallback = React.useCallback((node) => {
    if (ref.current) {
      confetti.reset()
    }
    if (node) {
      var rect = node.getBoundingClientRect()
      confetti({
        disableForReducedMotion: true,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        particleCount: 50,
        startVelocity: 30,
        spread: 270,
      })
    }
    ref.current = node
  }, [])

  return (
    <div>
      <div className="mt-2 animate__animated animate__bounceIn">
        <h3 className="mb-3" ref={refCallback}>
          {`Winner${winner.members.size === 1 ? "" : "s"}! `}
          <Badge
            bg={hardMode ? "danger" : "primary"}
            style={{ fontSize: ".5em" }}
          >
            Round {round}
          </Badge>
        </h3>

        <Row className="justify-content-center align-items-center">
          {[...winner.members].map((user) => (
            <Col key={users.get(user).id} className="col-auto">
              <div className="mb-3">
                <Avatar
                  className="animate__animated animate__infinite animate__pulse animate__slow w-100"
                  style={{ maxWidth: "150px", marginBottom: "-.5em" }}
                  id={users.get(user).avatar}
                />
                <div
                  className="h4"
                  style={{
                    fontSize: winner.members.size === 1 ? "2em" : "1em",
                  }}
                  data-testid="winner-name"
                >
                  {users.get(user).name}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {roomLetterBlendWord && (
          <div className="mb-4">
            <strong>Last word:</strong>{" "}
            <Badge
              data-testid="last-word"
              bg="secondary"
              style={{ fontSize: "1em" }}
            >
              <Highlight
                searchWords={[roomLetterBlend?.toUpperCase()]}
                textToHighlight={roomLetterBlendWord?.toUpperCase()}
              />
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
