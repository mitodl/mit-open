describe("Home", () => {
  it("Home page loads and main elements are visible", () => {
    cy.visit(Cypress.env("base_url"))

    cy.findByRole("link", { name: "MIT Open" })

    cy.findByRole("heading", { name: "Learn from MIT" })

    cy.findByPlaceholderText("What do you want to learn?")

    cy.findByRole("heading", { name: "Upcoming Courses" })
  })
})
