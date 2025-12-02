import React from "react"
import Button from "react-bootstrap/Button"
import Badge from "react-bootstrap/Badge"

interface MusicLabelProps {
    toggleMusicVersion: () => void;
}

export const MusicLabel = ({ toggleMusicVersion }: MusicLabelProps) => (
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
