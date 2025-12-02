import { fireEvent, render, screen } from "@testing-library/react"
import { vi, expect, test } from 'vitest'
import App from "./App"

// Mock the Turnstile component to immediately render its children or a success state
// Because the Captcha component wrapper waits for "solved" status.
// But Captcha wraps children, so we need to simulate the success.
// Actually, looking at App.jsx, if status === 'solved', it renders children.
// If not, it renders Turnstile.
// We should probably mock Turnstile to call onSuccess immediately.

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess: () => void }) => {
    // Call onSuccess immediately to bypass captcha in tests
    setTimeout(() => onSuccess(), 0);
    return <div id="cf-turnstile"></div>;
  }
}));

test("renders welcome title", async () => {
  render(<App />)
  const text = await screen.findByText("Welcome to 💣party!")
  expect(text).toBeInTheDocument()
})

test("should be able to check the private room checkbox", async () => {
  render(<App />)
  const checkbox = await screen.findByLabelText("Private room") as HTMLInputElement

  expect(checkbox.checked).toEqual(false)
  fireEvent.click(checkbox)
  expect(checkbox.checked).toEqual(true)
})

test("should be able to create a room", async () => {
  render(<App />)
  const button = await screen.findByText("Create room")

  fireEvent.click(button)

  expect(await screen.findByText("Initializing room")).toBeInTheDocument()
})
