describe("Home page", () => {
    it("hase the right page title", () => {
        const page = cy.visit("/");
        page.get("title").should("include.text", "Christian Nunciato");
    });
});
