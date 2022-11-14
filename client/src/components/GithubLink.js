import React from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { ReactComponent as GithubIcon } from "images/github.svg"

export const GithubLink = () => {
  return (
    <a
      href="https://github.com/Laosing/bombparty-clone"
      rel="noreferrer"
      target="_blank"
      className="position-absolute bottom-0 start-0 text-decoration-none  p-2"
    >
      <LinkTooltip />
    </a>
  )
}

const LinkTooltip = () => {
  const renderTooltip = (props) => (
    <Tooltip id="link-tooltip" {...props}>
      Check it out on github!
    </Tooltip>
  )
  return (
    <OverlayTrigger overlay={renderTooltip} placement="right">
      <GithubIcon style={{ fill: "var(--bs-gray-600)" }} />
    </OverlayTrigger>
  )
}
