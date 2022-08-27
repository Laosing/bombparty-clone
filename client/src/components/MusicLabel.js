import React from "react"
import { Button, Badge } from "react-bootstrap"

export const MusicLabel = ({ toggleMusicVersion }) => (
  <Badge
    as={Button}
    bg="secondary border-0"
    style={{ fontSize: ".65em" }}
    onClick={toggleMusicVersion}
    className="ms-2"
  >
    Change song
  </Badge>
)
