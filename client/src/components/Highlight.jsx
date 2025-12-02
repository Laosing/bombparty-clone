import React from "react"
import Highlighter from "react-highlight-words"

export const Highlight = ({ ...props }) => {
  return (
    <Highlighter
      highlightTag="span"
      unhighlightClassName=""
      highlightClassName={"text-warning"}
      autoEscape={true}
      {...props}
    />
  )
}
