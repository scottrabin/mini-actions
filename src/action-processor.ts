import { Action, ActionCreator } from "./actions";

/**
 * Extensible function which handles specific action types, as well as optionally
 * handling unrecognized actions.
 */
type ActionProcessor<F, O> =
    (F extends Function
        ? (O extends Function ? (F & O) : F)
        : (O extends Function ? O : never)) &
    {
        /**
         * Creates a new action handler which can handle actions of the provided
         * type.
         *
         * @param creator Action creator whose returned action should be handled
         * @param fn handler of the returned action
         */
        when: <T extends string, P, M, RV>(
            creator: ActionCreator<T, P, M, any>,
            fn: (action: Action<T, P, M>) => RV,
        ) => ActionProcessor<F & typeof fn, O>; // eslint-disable-line no-undef
        /**
         * Creates a new action handler which handles any action using the provided function.
         *
         * @param fn Catch-all action handler called when unspecific actions are provided
         */
        otherwise: <RV>(
            fn: (action: Action<string, unknown, unknown>) => RV,
        ) => ActionProcessor<F, typeof fn>; // eslint-disable-line no-undef
    };

function createProcessor<ActionMap extends { [key: string]: (...args: any) => any }, O extends (...args: any) => any>(
    actionMap: ActionMap,
    otherwise?: O,
): ActionProcessor<ActionMap[keyof ActionMap], O> {
    let fn;
    if (otherwise) {
        fn = <T extends string>(
            action: (T extends keyof ActionMap ? Parameters<ActionMap[T]>[0] : Action<string, unknown, unknown>),
        ): (T extends keyof ActionMap ? ReturnType<ActionMap[T]> : ReturnType<O>) => {
            if (action.type in actionMap) {
                return actionMap[action.type](action);
            } else {
                return otherwise(action);
            }
        };
    } else {
        fn = <T extends keyof ActionMap>(action: Parameters<ActionMap[T]>[0]): ReturnType<ActionMap[T]> => {
            return actionMap[action.type](action);
        };
    }
    return Object.assign(fn, {
        when: <T extends string, P, M, RV>(
            creator: ActionCreator<T, P, M, any>,
            fn: (action: Action<T, P, M>) => RV,
        ) => {
            return createProcessor({ ...actionMap, [creator.type]: fn }, otherwise);
        },
        otherwise: <RV>(
            fn: (action: Action<string, unknown, unknown>) => RV,
        ): ActionProcessor<ActionMap[keyof ActionMap], typeof fn> => {
            return createProcessor(actionMap, fn);
        }
    });
}

/**
 * Creates an action handler which can process actions created by the provided
 * action creator.
 *
 * @param creator Action creator whose returned action should be handled
 * @param fn handler of the returned action
 */
export function when<T extends string, P, M, RV>(
    creator: ActionCreator<T, P, M, any>,
    fn: (action: Action<T, P, M>) => RV,
): ActionProcessor<(action: Action<T, P, M>) => RV, void> {
    return createProcessor({ [creator.type]: fn });
}

/**
 * Creates an action handler which handles any action using the provided function.
 *
 * @param fn Catch-all action handler called when unspecific actions are provided
 */
export function otherwise<RV>(
    fn: (action: Action<string, unknown, unknown>) => RV,
): ActionProcessor<void, typeof fn> {
    return createProcessor({}, fn);
}
