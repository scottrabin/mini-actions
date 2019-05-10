import { hello } from "../src/index";

describe("index", () => {
    it("works", () => {
        expect(hello()).toEqual("ok");
    });
});
