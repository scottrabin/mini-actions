import { createAction } from "../src/actions";
import { when, otherwise } from "../src/action-processor";

describe("action-processor", () => {
    describe("when", () => {
        it("should create a function which accepts actions created by the specified creator and returns the correct value", () => {
            let n = 0;
            const increase = createAction("increase", (value: number) => ({ value }));
            const processor = when(increase, ({ payload }) => n += payload.value);

            expect(processor(increase(4))).toBe(4);
            expect(processor(increase(2))).toBe(6);
            expect(n).toBe(6);
        });

        it("should create a function which accepts any of the specified actions and returns the correct value", () => {
            const stringX = createAction("tostring", (value: { toString(): string }) => value);
            const numberX = createAction("tonumber", (value: string) => value);
            const processor = when(stringX, ({ payload }) => payload.toString()).
                when(numberX, ({ payload }) => parseFloat(payload));

            const stringResult: string = processor(stringX(12345));
            const numberResult: number = processor(numberX("abcde"));
            expect(stringResult).toBe("12345");
            expect(numberResult).toBe(NaN);
        });

        it("should create a function which can allow any action to be processed", () => {
            const unknownAction = createAction("type", (value: string | null) => value);
            const processor = otherwise(({ payload }) => Boolean(payload));

            expect(processor(unknownAction(null))).toBe(false);
            expect(processor(unknownAction("a string"))).toBe(true);
        });

        it("should allow creating complex action processors", () => {
            let x = 0;
            let y = 0;
            const moveX = createAction("x", (value: number) => value);
            const moveY = createAction("y", (value: number) => value);
            const other = createAction("other");
            const processor = when(moveX, ({ payload }) => x += payload).
                when(moveY, ({ payload }) => y += payload).
                otherwise(() => ({ x, y }));

            [moveX(3), moveY(4), moveX(-2), moveY(-5)].forEach(processor);
            expect(x).toBe(1);
            expect(y).toBe(-1);
            expect(processor(other())).toStrictEqual({ x, y });
        });

        it("should allow replacing the catchall action handler", () => {
            const anAction = createAction("thing");
            const processor = otherwise(action => parseFloat(action.type)).
                otherwise(action => action.type);

            const result: string = processor(anAction());
            expect(result).toBe("thing");
        });
    });
});
