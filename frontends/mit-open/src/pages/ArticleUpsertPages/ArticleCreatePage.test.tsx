import React from "react"
import { screen, user, renderWithProviders } from "../../test-utils"
import { articles as factory } from "api/test-utils/factories"
import { makeRequest, setMockResponse, urls } from "api/test-utils"
import ArticleCreatePage from "./ArticleCreatePage"

describe("ArticleCreatePage", () => {
  test("Has 'Save' and 'Cancel' but not 'Delete' buttons", async () => {
    renderWithProviders(<ArticleCreatePage />)
    await screen.findByRole("button", { name: "Save" })
    await screen.findByRole("button", { name: "Cancel" })
    const deleteButton = screen.queryByRole("button", { name: "Delete" })

    expect(deleteButton).toBe(null)
  })

  test("Calls creation endpoint when saved", async () => {
    const article = factory.article()
    const { location } = renderWithProviders(<ArticleCreatePage />)
    const titleInput = await screen.findByLabelText(/Title/)
    const bodyInput = screen.getByTestId("mock-ckeditor")
    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(titleInput)
    await user.paste(article.title)
    await user.click(bodyInput)
    await user.paste(article.html)

    setMockResponse.post(urls.articles.list(), article)
    await user.click(saveButton)
    expect(makeRequest).toHaveBeenCalledWith("post", urls.articles.list(), {
      title: article.title,
      html: article.html,
    })

    expect(location.current.pathname).toBe(`/articles/${article.id}`)
  })
})
