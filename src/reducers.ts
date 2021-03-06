import {
    Action,
    ActionCreator,
} from "./actions";

const HANDLED_ACTIONS = Symbol("handled actions");

interface PredefinedActions {
    [HANDLED_ACTIONS]: { [type: string]: any };
}

function hasPredefinedActions(obj: unknown): obj is PredefinedActions {
    return Object.prototype.hasOwnProperty.call(obj, HANDLED_ACTIONS);
}

/**
 * A reducer of some state S over the given action type(s) in A, which typically
 * becomes a discriminated union after building up well-typed reducers.
 */
export type Reducer<S, A> = (state: S, action: A) => S;

/**
 * A reducer which has a default value for the state assigned. Mostly a
 * convenience type for clarity through the library.
 */
export type ReducerWithDefault<S, A> = Reducer<S, A> & ((state: undefined, action: A) => S);

/**
 * An enhanced reducer with a `when` method, which allows for immutably
 * constructing reducers that only accept specific action types.
 */
export interface ReducerExtender<S, A> {
    when: <T extends string, P, M>(
        creator: ActionCreator<T, P, M, any>,
        reducer: Reducer<S, Action<T, P, M>>,
    ) => ReducerWithDefault<S, A | Action<T, P, M>> & ReducerExtender<S, A | Action<T, P, M>>;
}

/**
 * Extracts the defined action from a given reducer
 */
export type ReducerAction<R extends Reducer<any, any>> = Parameters<R>[1];

/**
 * Extracts the state defined by a given reducer
 */
export type ReducerState<R> = (R extends Reducer<infer S, any> ? S : never);

/**
 * An enhanced reducer function augmented with a `when` method, which allows
 * for immutably constructing reducers which accept only specific action types.
 */
type ReducerCreator<S, A> = ReducerWithDefault<S, A> & ReducerExtender<S, A>;

// eslint-disable-next-line no-undef
function mappedReducer<S, ActionMap extends { [key: string]: Reducer<S, Action<typeof key, any, any>> }>(
    initialState: S,
    actionMap: ActionMap,
): ReducerCreator<S, ReducerAction<ActionMap[keyof ActionMap]>> & PredefinedActions {
    return Object.assign(
        (state: S = initialState, action: ReducerAction<ActionMap[keyof ActionMap]>) => {
            if (action.type in actionMap) {
                return actionMap[action.type](state, action);
            } else {
                return state;
            }
        },
        {
            [HANDLED_ACTIONS]: actionMap,
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

    const handledActions = Object.keys(reducers).reduce((map: { [key: string]: any } | null, prop) => {
        const reducer = reducers[prop];
        if (map && hasPredefinedActions(reducer)) {
            return Object.assign(map, reducer[HANDLED_ACTIONS]);
        } else {
            return null;
        }
    }, {});

    return Object.assign(
        (state: void | State, action: ReducerAction<ReducerMap[keyof ReducerMap]>): State => {
            if (state && handledActions && !(action.type in handledActions)) {
                return state;
            }

            const result: Partial<State> = {};
            let changed = false;

            for (const k of (Object.keys(reducers) as Array<keyof ReducerMap>)) {
                result[k] = reducers[k](state && state[k], action);
                if (!changed) {
                    changed = (state && state[k]) !== result[k];
                }
            }

            return (changed ? result : state) as State;
        },
        {
            [HANDLED_ACTIONS]: handledActions,
        },
    );
}
