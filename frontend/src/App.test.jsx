import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import App from "./App.jsx"

describe("FaceTrack workspace", () => {
  it("runs the synthetic recognition session through its completed state", async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole("heading", { name: /inspect the match/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /run recognition/i }))
    expect(screen.getByRole("button", { name: /comparing faces/i })).toBeDisabled()
    expect(await screen.findByRole("button", { name: /run again/i }, { timeout: 2_000 })).toBeEnabled()
    expect(screen.getByText("3", { selector: ".match-summary strong" })).toBeInTheDocument()
  })

  it("navigates between roster and attendance views", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: "roster" }))
    expect(await screen.findByRole("heading", { name: /keep identity enrollment explicit/i })).toBeInTheDocument()
    expect(await screen.findByText("Ava Chen")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "attendance" }))
    expect(screen.getByRole("heading", { name: /review the record/i })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /export csv/i })).toBeEnabled()
  })
})
