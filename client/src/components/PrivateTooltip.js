import React from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"

export const PrivateTooltip = () => {
  const renderTooltip = (props) => (
    <Tooltip id="private-tooltip" {...props}>
      This room is private
    </Tooltip>
  )
  return (
    <OverlayTrigger overlay={renderTooltip}>
      <span>🔒</span>
    </OverlayTrigger>
  )
}
