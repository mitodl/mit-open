import React from "react"
import { renderWithProviders, screen } from "../../test-utils"
import ArticleDetailsPage from "./ArticleDetailsPage"
import { Route } from "react-router"
import type { Article } from "api"
import { articles as factory } from "api/test-utils/factories"
import { setMockResponse, urls } from "api/test-utils"

const setup = ({ article }: { article: Article }) => {
  setMockResponse.get(urls.articles.details(article.id), article)
  renderWithProviders(
    <Route path="/article/:id">
      <ArticleDetailsPage />
    </Route>,
    { url: `/article/${article.id}` },
  )
}

describe("ArticleDetailsPage", () => {
  it("Renders title and html", async () => {
    const article = factory.article()
    setup({ article })
    await screen.findByRole("heading", {
      name: article.title,
    })
    screen.getByText(article.html)

    expect(document.title).toBe(article.title)
  })

  it("Shows a link to the edit page", async () => {
    const article = factory.article()
    setup({ article })
    const link = await screen.findByRole<HTMLAnchorElement>("link", {
      name: "Edit",
    })
    expect(link.href).toEndWith(`/articles/${article.id}/edit`)
  })
})
