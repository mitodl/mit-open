import { render } from "@testing-library/react"
import { Card } from "./Card"
import React from "react"

describe("Card", () => {
  test("has class MitCard-root on root element", () => {
    const { container } = render(
      <Card className="Foo">
        <Card.Content>Hello world</Card.Content>
      </Card>,
    )
    const card = container.firstChild

    expect(card).toHaveClass("MitCard-root")
    expect(card).toHaveClass("Foo")
  })
})
