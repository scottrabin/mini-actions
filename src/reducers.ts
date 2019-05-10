import {
    Action,
    ActionCreator,
} from "./actions";

/**
 * A reducer of some state S over the given action type(s) in A, which typically
 * becomes a discriminated union after building up well-typed reducers.
 */
export type Reducer<S, A> = (state: S, action: A) => S;

/**
 * Extracts the defined action from a given reducer
 */
type ReducerAction<R extends Reducer<any, any>> = Parameters<R>[1];

/**
 * An enhanced reducer function augmented with a `when` method, which allows
 * for immutably constructing reducers which accept only specific action types.
 */
export type ReducerCreator<S, A> =
    Reducer<void | S, A> & {
        when: <T extends string, P, M>(
            creator: ActionCreator<T, P, M, any>,
            reducer: Reducer<S, Action<T, P, M>>,
        ) => ReducerCreator<S, A | Action<T, P, M>>;
    };

// eslint-disable-next-line no-undef
function mappedReducer<S, ActionMap extends { [key: string]: Reducer<S, Action<typeof key, any, any>> }>(
    initialState: S,
    actionMap: ActionMap,
): ReducerCreator<S, ReducerAction<ActionMap[keyof ActionMap]>> {
    return Object.assign(
        (state: S = initialState, action: ReducerAction<ActionMap[keyof ActionMap]>) => {
            if (action.type in actionMap) {
                return actionMap[action.type](state, action);
            } else {
                return state;
            }
        },
        {
            when: <T extends string, P, M>(creator: ActionCreator<T, P, M, any>, reducer: Reducer<S, Action<T, P, M>>) => {
                return mappedReducer(initialState, { ...actionMap, [creator.type]: reducer });
            }
        }
    );
}

/**
 * Creates a reducer seeded with the given initial state, which has no defined
 * accepted actions. Serves as the starting point for defining well-typed reducers.
 *
 * @param initialState
 */
export function createReducer<S>(initialState: S): ReducerCreator<S, never> {
    return mappedReducer(initialState, {});
}

/**
 * Combines a set of reducers into one parent object reducer which delegates the
 * modifications to each property of the object to the provided reducer.
 *
 * @param reducers Map of object property to reducer governing its value
 */
export function combineReducers<ReducerMap extends { [key: string]: Reducer<any, any> }>(
    reducers: ReducerMap,
): Reducer<void | { [K in keyof ReducerMap]: ReturnType<ReducerMap[K]> }, ReducerAction<ReducerMap[keyof ReducerMap]>> {
    type State = { [K in keyof ReducerMap]: ReturnType<ReducerMap[K]> };
    return (state, action) => {
        const result: Partial<State> = {};
        let changed = false;

        for (let k of Object.keys(reducers)) {
            result[k] = reducers[k](state && state[k], action);
            if (!changed) {
                changed = (state && state[k]) !== result[k];
            }
        }

        return (changed ? result as State : state);
    };
}
