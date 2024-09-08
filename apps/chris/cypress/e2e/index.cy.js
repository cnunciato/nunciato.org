describe("Home page", () => {
    beforeEach(() => {
        cy.visit("/");
    });

    it("has the right page title", () => {
        cy.get("title").should("include.text", "Christian Nunciato");
    });

    it("has three photo cards", () => {
        cy.get("main ol li").should("have.length", 3);
    });
});
