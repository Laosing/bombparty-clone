import { render, screen } from "@testing-library/react"
import { roomWithWinner, roomWrapper } from "tests/utils"
import { Winner } from "./Winner"

test("renders the winner", () => {
  const winner = roomWithWinner.get("winner")
  const lastWord = roomWithWinner.get("letterBlendWord").toUpperCase()
  const winnerName = roomWithWinner
    .get("users")
    .get(winner.members.values().next().value).name

  render(<Winner winner={winner} />, { wrapper: roomWrapper(roomWithWinner) })

  expect(screen.getByText("Winner!")).toBeInTheDocument()
  expect(screen.getByText("Last word:")).toBeInTheDocument()
  expect(screen.getByTestId("last-word")).toHaveTextContent(lastWord)
  expect(screen.getByTestId("winner-name")).toHaveTextContent(winnerName)
})
