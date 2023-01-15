import React from "react"
import { createAvatar } from "@dicebear/core"
import { bigSmile } from "@dicebear/collection"

export const Avatar = ({ id, ...props }) => {
  const avatar = React.useMemo(() => createAvatar(bigSmile, { seed: id }), [id])

  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar)}`}
      alt=""
      {...props}
    />
  )
}
