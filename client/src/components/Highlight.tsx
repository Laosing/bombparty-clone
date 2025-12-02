import React from "react"
import Highlighter, { HighlighterProps } from "react-highlight-words"

export const Highlight = ({ ...props }: HighlighterProps) => {
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
