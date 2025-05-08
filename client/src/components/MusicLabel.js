import React from "react"
import Button from "react-bootstrap/Button"
import Badge from "react-bootstrap/Badge"

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
