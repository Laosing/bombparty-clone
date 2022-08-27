import { render, screen } from "@testing-library/react"
import { socketWrapper } from "tests/utils"
import { ValidateRoom } from "./ValidateRoom"

import { MemoryRouter, Route, Routes } from "react-router-dom"

const renderRoom = (roomId) => {
  const component = socketWrapper(<ValidateRoom />)
  render(
    <MemoryRouter initialEntries={[roomId]}>
      <Routes>
        <Route path=":roomId" element={component}></Route>
      </Routes>
    </MemoryRouter>
  )
}

it("should render invalid rooms", () => {
  renderRoom("/invalid")

  expect(screen.getByText("Invalid room")).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: "Back to home" })
  ).toBeInTheDocument()
})

it("should initialize valid rooms", () => {
  renderRoom("/TEST")

  expect(screen.getByText("Initializing room")).toBeInTheDocument()
})
