describe("Home page", () => {
    beforeEach(() => {
        cy.visit("/");
    });

    it("has the right page title", () => {
        cy.get("title").should("include.text", "Christian Nunciato");
    });
});

describe("Photos page", () => {});
