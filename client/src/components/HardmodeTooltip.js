import React from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"

export const HardmodeTooltip = () => {
  const renderTooltip = (props) => (
    <Tooltip id="hardMode-tooltip" {...props}>
      Randomizes the bomb timer (subtracts a random number between 0 - timer/2)
    </Tooltip>
  )
  return (
    <OverlayTrigger overlay={renderTooltip}>
      <span style={{ width: "fit-content" }}>ℹ️</span>
    </OverlayTrigger>
  )
}
