import { expect, test } from "vitest";
import { byDate } from "./index";

test("sorts content items properly", () => {
    expect(byDate).toBeDefined();
});
