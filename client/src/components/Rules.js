import React from "react"
import { Alert } from "react-bootstrap"
import clsx from "clsx"
import { useGameStore } from "hooks/useStore"

export const Rules = ({ className }) => {
  const setIsAdmin = useGameStore((state) => state.setIsAdmin)
  const toggleAdmin = () => setIsAdmin((p) => !p)
  const theme = useGameStore((store) => store.theme)
  return (
    <Alert
      style={{ maxWidth: "30em" }}
      className={clsx("mx-auto", className)}
      variant={theme === "light" ? "primary" : "warning"}
    >
      <h5>Rules 🧐</h5>
      <p className="small">
        On a player's turn they must type a word (3 letters or more) containing
        the given letters in the <strong>same order</strong> before the bomb
        explodes <span onClick={toggleAdmin}>🤯</span> (example: LU - BLUE).
      </p>
      <p className="small">
        If a player does not type a word in time, they lose a heart 💀. The last
        player remaining wins the game 🎉.
      </p>
      <p className="small mb-0">
        The alphabet is at the top, use all the letters to gain a heart ❤️.
        Bonus for long words: if the word is 11 letters or longer the player
        gets a free random letter 🤓.
      </p>
    </Alert>
  )
}
