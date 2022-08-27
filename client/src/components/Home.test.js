import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { socketWrapper } from "tests/utils"
import { Home } from "./Home"

import { MemoryRouter, Route, Routes } from "react-router-dom"

const customerRender = () => {
  const component = socketWrapper(<Home />)

  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={component} />
        <Route path=":roomId" element={<></>} />
      </Routes>
    </MemoryRouter>
  )
}

it("should render home component", () => {
  customerRender()

  const button = screen.getByRole("button", { name: "Create room" })

  expect(button).toBeInTheDocument()
  expect(screen.getByText("Welcome to 💣party!")).toBeInTheDocument()
})

it("should be able to create a room", () => {
  customerRender()

  const button = screen.getByRole("button", { name: "Create room" })

  fireEvent.click(button)

  expect(button).not.toBeInTheDocument()
})

it("should be able to join a valid custom room", async () => {
  customerRender()
  const user = userEvent.setup()
  const inputValue = "TEST"
  const formInput = screen.getByLabelText(
    "Know an existing room? Enter it here!"
  )

  await user.type(formInput, inputValue)

  expect(screen.queryByText("Know an existing room")).not.toBeInTheDocument()
  expect(formInput.value).toBe(inputValue)

  await user.click(screen.getByRole("button", { name: "Join" }))

  await waitFor(() => expect(formInput).not.toBeInTheDocument())
})
