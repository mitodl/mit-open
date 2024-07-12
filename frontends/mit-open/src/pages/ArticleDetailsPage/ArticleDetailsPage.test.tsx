import { renderTestApp, screen, waitFor } from "../../test-utils"
import type { Article } from "api"
import { articles as factory } from "api/test-utils/factories"
import { setMockResponse, urls } from "api/test-utils"

const setup = ({ article }: { article: Article }) => {
  setMockResponse.get(urls.articles.details(article.id), article)
  renderTestApp({
    url: `/articles/${article.id}`,
    user: { is_article_editor: true },
  })
}

describe("ArticleDetailsPage", () => {
  it("Renders title and html", async () => {
    const article = factory.article()
    setup({ article })
    await screen.findByRole("heading", {
      name: article.title,
    })
    screen.getByText(article.html)

    await waitFor(() => {
      expect(document.title).toBe(`${article.title} | MIT Open`)
    })
  })

  it("Shows a link to the edit page", async () => {
    const article = factory.article()
    setup({ article })
    const link = await screen.findByRole<HTMLAnchorElement>("link", {
      name: "Edit",
    })
    expect(link.href.endsWith(`/articles/${article.id}/edit`)).toBe(true)
  })
})
