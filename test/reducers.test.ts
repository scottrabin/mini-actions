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

        it("should return the same initial object if none of the properties have changed", () => {
            const increment = createAction("increment", (value: number) => value);
            const reducer = combineReducers({
                x: createReducer(0).when(increment, (state, { payload }) => state + payload),
            });
            const state = { x: 5 };
            expect(reducer(state, increment(0))).toBe(state);
        });

        it("should short circuit if none of the reducers handle the provided action", () => {
            const firstAction = createAction("first");
            const secondAction = createAction("second");
            const spies = [
                jest.fn(state => state + 1),
                jest.fn(state => state - 1),
            ];
            const reducer = combineReducers({
                top: combineReducers({
                    one: createReducer(0).when(firstAction, spies[0]),
                }),
                bottom: combineReducers({
                    second: createReducer(0).when(secondAction, spies[1]),
                }),
            });

            expect(reducer({ top: { one: 0 }, bottom: { second: 0 } }, secondAction())).toMatchSnapshot();
            expect(spies[0].mock.calls.length).toBe(0);
            expect(spies[1].mock.calls.length).toBe(1);
        });

        it("should accept reducers not created via `createReducer`", () => {
            const action = createAction("action");
            const reducer = combineReducers({
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                property: (state: number = 0, _: any) => state,
            });

            expect(reducer(void 0, action())).toMatchSnapshot();
        });
    });
});
