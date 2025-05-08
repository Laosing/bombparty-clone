import React from "react"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"
import Tooltip from "react-bootstrap/Tooltip"

export const PrivateTooltip = () => {
  const renderTooltip = (props) => (
    <Tooltip
      id="private-tooltip"
      {...props}
    >
      This room is private
    </Tooltip>
  )
  return (
    <OverlayTrigger overlay={renderTooltip}>
      <span>🔒</span>
    </OverlayTrigger>
  )
}
