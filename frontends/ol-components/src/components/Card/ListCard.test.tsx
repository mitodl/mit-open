import { render } from "@testing-library/react"
import { ListCard } from "./ListCard"
import React from "react"

describe("ListCard", () => {
  test("has class MitCard-root on root element", () => {
    const { container } = render(
      <ListCard className="Foo">
        <ListCard.Content>Hello world</ListCard.Content>
      </ListCard>,
    )
    const card = container.firstChild

    expect(card).toHaveClass("MitListCard-root")
    expect(card).toHaveClass("Foo")
  })
})
