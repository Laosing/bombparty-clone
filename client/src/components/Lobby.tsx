import React from "react"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"
import Tooltip from "react-bootstrap/Tooltip"
import { useRoom } from "hooks/useRoom"
import { Avatar } from "components/Avatar"
import { User } from "types/index"

export const Lobby = () => {
  const { room } = useRoom()
  const players = room.get("users") as Map<string, User>
  const running = room.get("running")

  const lobbyPlayers = [...players].filter(([, val]) => !val.inGame)

  if (running || lobbyPlayers.length === 0) {
    return null
  }

  const tooltip = (props: any, name: string) => (
    <Tooltip
      id="avatar-tooltip"
      {...props}
    >
      {name}
    </Tooltip>
  )

  return (
    <div
      style={{ maxWidth: "30em" }}
      className="mx-auto"
    >
      <hr />
      <h5>Players not in game</h5>
      {lobbyPlayers.map(([id, val]) => (
        <OverlayTrigger
          key={id}
          overlay={(props) => tooltip(props, val.name)}
        >
          <div
            style={{ width: "3em" }}
            className="d-inline-block"
          >
            <Avatar id={val.avatar} />
          </div>
        </OverlayTrigger>
      ))}
    </div>
  )
}
