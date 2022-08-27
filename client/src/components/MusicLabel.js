import React from "react"
import { Button, Badge } from "react-bootstrap"

export const MusicLabel = ({ toggleMusicVersion }) => (
  <>
    Music{" "}
    <Badge
      as={Button}
      bg="secondary border-0"
      style={{ fontSize: ".65em" }}
      onClick={toggleMusicVersion}
    >
      Change song
    </Badge>
  </>
)
