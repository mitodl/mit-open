import React from "react"
import { render } from "@testing-library/react"
import CkeditorDisplay from "./CkeditorDisplay"

describe("CkeditorDisplay", () => {
  it("Renders <oembed> tags as embedly cards", () => {
    const htmlIn = `
<p>Some text</p>
<figure class="media">
  <oembed url="https://openlearning.mit.edu/"></oembed>
</figure>
<p>More text</p>
<figure class="media">
  <oembed url="https://mit.edu/"></oembed>
</figure>
<p>Some more text</p>
    `.trim()
    const expectedHtmlOut = `
<p>Some text</p>
<a data-card-chrome="0" data-card-controls="0" data-card-key="fake-embedly-key" class="embedly-card" href="https://openlearning.mit.edu/"></a>
<p>More text</p>
<a data-card-chrome="0" data-card-controls="0" data-card-key="fake-embedly-key" class="embedly-card" href="https://mit.edu/"></a>
<p>Some more text</p>
    `.trim()
    const view = render(<CkeditorDisplay dangerouslySetInnerHTML={htmlIn} />)
    expect(view.container.children.length).toBe(1)
    const container = view.container.children[0]
    expect(container.innerHTML).toBe(expectedHtmlOut)
  })

  it("Adds ck-content class to container", () => {
    const view = render(<CkeditorDisplay dangerouslySetInnerHTML="Hello" />)
    expect(view.container.firstChild).toHaveClass("ck-content")
  })

  test("HTML re-renders correctly", () => {
    /**
     * Normally we wouldn't check re-rendering logic like this, but we're
     * manipulating the raw HTML, and depending on how one does that, it can
     * be susceptible to re-rendering bugs.
     */

    const input0 = `
<p>Some text</p>
<figure class="media">
  <oembed url="https://openlearning.mit.edu/"></oembed>
</figure>
<p>More text</p>
<figure class="media">
  <oembed url="https://mit.edu/"></oembed>
</figure>
<p>Some more text</p>
        `.trim()
    const input1 = input0
    const input2 = "input2"
    const view = render(<CkeditorDisplay dangerouslySetInnerHTML={input0} />)
    const html0 = view.container.innerHTML
    view.rerender(<CkeditorDisplay dangerouslySetInnerHTML={input1} />)
    const html1 = view.container.innerHTML
    expect(html0).toBe(html1)

    view.rerender(<CkeditorDisplay dangerouslySetInnerHTML={input2} />)
    const html2 = view.container.children[0].innerHTML
    expect(html2).toBe("input2")
  })
})
