import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test } from 'vitest'
import { AudioSettings } from "./AudioSettings"

test("renders Music toggle", () => {
  render(<AudioSettings />)
  const toggle = screen.getByLabelText("Music") as HTMLInputElement
  const changeSong = screen.getByRole("button", { name: "Change song" })

  expect(toggle.checked).toEqual(true)
  fireEvent.click(toggle)
  expect(toggle.checked).toEqual(false)
  expect(changeSong).toBeInTheDocument()
})

test("renders Sound effects toggle", () => {
  render(<AudioSettings />)
  const toggle = screen.getByLabelText("Sound effects") as HTMLInputElement

  expect(toggle.checked).toEqual(true)
  fireEvent.click(toggle)
  expect(toggle.checked).toEqual(false)
})

test("renders Dark Mode toggle", () => {
  render(<AudioSettings />)
  const toggle = screen.getByLabelText("Dark Mode") as HTMLInputElement

  expect(toggle.checked).toEqual(false)
  fireEvent.click(toggle)
  expect(toggle.checked).toEqual(true)
})

test("renders Volume slider", () => {
  render(<AudioSettings />)
  const slider = screen.getByLabelText("Volume", { selector: "input" })

  fireEvent.change(slider, {
    target: { value: 1 }
  })

  expect(slider).toHaveValue("1")
})
