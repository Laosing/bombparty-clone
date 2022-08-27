import React from "react"
import { createAvatar } from "@dicebear/avatars"
import * as avatarStyle from "@dicebear/big-smile"

export const Avatar = ({ id, ...props }) => {
  const avatar = React.useMemo(
    () => createAvatar(avatarStyle, { seed: id }),
    [id]
  )

  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar)}`}
      alt=""
      {...props}
    />
  )
}
