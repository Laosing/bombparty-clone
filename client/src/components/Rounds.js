import React from "react"
import clsx from "clsx"
import { useRoom } from "hooks/useRoom"

export function Rounds() {
  const { room } = useRoom()
  const round = room.get("round")
  const running = room.get("running")
  const hardMode = room.get("hardMode")

  if (!running) {
    return null
  }

  return (
    <div
      style={{ top: "-2em" }}
      className={clsx(hardMode && "text-danger", "position-absolute")}
    >
      Round <strong>{round}</strong>
    </div>
  )
}
