import * as actions from "../src/actions";

describe("actions", () => {
    describe("createActions", () => {
        it("can create actions with no payload or metadata", () => {
            const actionCreator = actions.createAction("test action");

            expect(actionCreator()).toEqual({
                type: "test action",
            });
        });

        it("can create actions with a payload", () => {
            const actionCreator = actions.createAction("test action", (value: string) => ({ value }));

            expect(actionCreator("yes")).toEqual({
                type: "test action",
                payload: {
                    value: "yes",
                },
            });
        });

        it("can create actions with metadata", () => {
            const actionCreator = actions.createAction("test action", null, (value: number) => ({ metaValue: value }));

            expect(actionCreator(3)).toEqual({
                type: "test action",
                meta: {
                    metaValue: 3,
                },
            });
        });

        it("can create actions with both payload and metadata", () => {
            const actionCreator = actions.createAction(
                "test action",
                (first: string, second: number) => ({ first, second: second.toString() }),
                (first: string, second: number) => ({ first: parseInt(first, 10), second }),
            );

            expect(actionCreator("1", 2)).toEqual({
                type: "test action",
                payload: {
                    first: "1",
                    second: "2",
                },
                meta: {
                    first: 1,
                    second: 2,
                },
            });
        });
    });
});
