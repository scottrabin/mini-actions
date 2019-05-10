import { createAction } from "../src/actions";
import { createReducer, combineReducers } from "../src/reducers";

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

    describe("combineReducers", () => {
        it("can combine reducers accepting the same action", () => {
            const action = createAction("reset");
            const rOne = createReducer({ one: 1 }).when(action, s => s);
            const rTwo = createReducer({ two: 2 }).when(action, s => s);
            const reducer = combineReducers({ rOne, rTwo });

            expect(reducer(void 0, action())).toStrictEqual({
                rOne: {
                    one: 1,
                },
                rTwo: {
                    two: 2,
                },
            });
            expect(reducer(void 0, action())).toEqual(reducer(void 0, action()));
        });

        it("can combine reducers accepting different actions", () => {
            const moveX = createAction("moveX", (value: number) => ({ value }));
            const moveY = createAction("moveY", (value: number) => ({ value }));
            const xPosition = createReducer(0).
                when(moveX, (state, { payload }) => (state + payload.value));
            const yPosition = createReducer(0).
                when(moveY, (state, { payload }) => (state + payload.value));
            const position = combineReducers({ x: xPosition, y: yPosition });

            expect(position(void 0, moveX(3))).toStrictEqual({ x: 3, y: 0 });
            expect(position(void 0, moveY(-6))).toStrictEqual({ x: 0, y: -6 });
            expect([
                moveX(3),
                moveY(4),
                moveX(-5),
                moveY(-11),
            ].reduce(position, void 0)).toStrictEqual({ x: -2, y: -7 });
        });
    });
});
