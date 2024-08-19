import React from "react"
import { assertPartialMetas, renderWithProviders, waitFor } from "@/test-utils"
import MetaTags from "./MetaTags"
import { faker } from "@faker-js/faker/locale/en"

const NODE_ENV = process.env.NODE_ENV

describe("MetaTags", () => {
  afterEach(() => {
    // Some tests here manipulate NODE_ENV, so let's reset it
    process.env.NODE_ENV = NODE_ENV
  })
  test("Sets expected tags", async () => {
    const title = faker.lorem.words()
    const description = faker.lorem.paragraph()
    const image = faker.image.url()
    const imageAlt = faker.lorem.paragraph()
    renderWithProviders(
      <MetaTags
        title={title}
        image={image}
        imageAlt={imageAlt}
        description={description}
      />,
    )

    const expectedTitle = `${title} | ${process.env.SITE_NAME}`
    await waitFor(() => {
      assertPartialMetas({
        title: expectedTitle,
        description,
        og: { title: expectedTitle, description, image, imageAlt },
        twitter: { image, description, card: "summary_large_image" },
      })
    })
  })

  test("Does not render social tags when social=false", async () => {
    const title = faker.lorem.words()
    const description = faker.lorem.paragraph()
    const image = faker.image.url()
    const imageAlt = faker.lorem.paragraph()
    renderWithProviders(
      <MetaTags
        title={title}
        image={image}
        imageAlt={imageAlt}
        description={description}
        social={false}
      />,
    )

    const expectedTitle = `${title} | ${process.env.SITE_NAME}`
    await waitFor(() => {
      assertPartialMetas({
        title: expectedTitle,
        description,
        og: {
          title: undefined,
          description: undefined,
          image: undefined,
          imageAlt: undefined,
        },
        twitter: { image: undefined, description: undefined, card: undefined },
      })
    })
  })

  test("Does not set title if absent", async () => {
    const description = faker.lorem.words()
    renderWithProviders(<MetaTags description={description} />)
    await waitFor(() => assertPartialMetas({ description }))
    expect(document.querySelector("title")).toBe(null)
    expect(document.querySelector('meta[property="og:title"]')).toBe(null)
  })

  test("Does not set description if absent", async () => {
    const title = faker.lorem.words()
    renderWithProviders(<MetaTags title={title} />)
    await waitFor(() =>
      assertPartialMetas({ title: `${title} | ${process.env.SITE_NAME}` }),
    )
    expect(document.querySelector('meta[name="description"]')).toBe(null)
    expect(document.querySelector('meta[name="og:description"]')).toBe(null)
    expect(document.querySelector('meta[name="twitter:description"]')).toBe(
      null,
    )
  })

  test.each([
    { url: "/some/path", expected: "/some/path" },
    { url: "/some/path/", expected: "/some/path" },
    { url: "/some/path?", expected: "/some/path" },
    { url: "/some/path/?", expected: "/some/path" },
    { url: "/some/path?a=1", expected: "/some/path?a=1" },
    { url: "/some/path/?a=1", expected: "/some/path?a=1" },
  ])("Canonicalizes the url", async ({ url, expected }) => {
    const description = faker.lorem.words()
    renderWithProviders(<MetaTags description={description} />, { url })
    await waitFor(() => assertPartialMetas({ description }))
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      window.origin + expected,
    )
  })
})
