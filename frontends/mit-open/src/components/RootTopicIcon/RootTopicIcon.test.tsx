import React from "react"
import RootTopicIcon, { ICON_MAP } from "./RootTopicIcon"
import { render } from "@testing-library/react"

describe("TopicIcon", () => {
  const rootTopicNames = Object.keys(ICON_MAP)

  /**
   * Since we've hard-coded root-level topic associations on the frontend, lets
   * at least make sure we have an icon for each of them.
   */
  test.each(rootTopicNames)("Root topics all have an icon", (name) => {
    expect(rootTopicNames.length).toBe(13)
    render(<RootTopicIcon icon={name} />)
    const svg = document.querySelector("svg")
    expect(svg).toBeVisible()
  })

  test("Unknown topics have a visibly hidden icon", () => {
    render(<RootTopicIcon icon="Unknown Topic" />)
    const svg = document.querySelector("svg")
    expect(svg).not.toBeVisible()
  })
})
