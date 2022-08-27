import { fireEvent, render, screen } from "@testing-library/react"
import App from "./App"

test("renders welcome title", () => {
  render(<App />)
  const text = screen.getByText("Welcome to 💣party!")
  expect(text).toBeInTheDocument()
})

test("should be able to check the private room checkbox", () => {
  render(<App />)
  const checkbox = screen.getByLabelText("Private room")

  expect(checkbox.checked).toEqual(false)
  fireEvent.click(checkbox)
  expect(checkbox.checked).toEqual(true)
})

test("should be able to create a room", async () => {
  render(<App />)
  const button = screen.getByText("Create room")

  fireEvent.click(button)

  expect(await screen.findByText("Initializing room")).toBeInTheDocument()
})
