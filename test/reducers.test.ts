import { createAction } from "../src/actions";
import { createReducer } from "../src/reducers";

describe("reducers", () => {
    describe("createReducer", () => {
        it("creates a reducer which returns the seeded initial state when given no current state", () => {
            const initialState = { one: 1 };
            const action = createAction("do nothing");
            const reducer = createReducer(initialState).when(action, s => s);

            expect(reducer(void 0, action())).toBe(initialState);
        });

        it("allows chaining with provided action creators to define a reducer", () => {
            const initialState = { value: 0 };
            const increment = createAction("increment", (value: number) => ({ value }));
            const decrement = createAction("decrement", (value: number) => ({ value }));
            const reducer = createReducer(initialState).
                when(increment, (state, { payload }) => ({
                    value: state.value + payload.value,
                })).
                when(decrement, (state, { payload }) => ({
                    value: state.value - payload.value,
                }));

            expect(reducer(void 0, increment(0))).toEqual({ value: 0 });
            expect(reducer({ value: 1 }, increment(3))).toEqual({ value: 4 });
            expect(reducer({ value: 1 }, decrement(7))).toEqual({ value: -6 });
        });
    });
});
