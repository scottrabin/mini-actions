interface ActionUnit<T extends string> {
    type: T;
}

interface ActionPayload<T extends string, P> extends ActionUnit<T> {
    payload: P;
}

interface ActionPayloadMeta<T extends string, P, M> extends ActionPayload<T, P> {
    meta: M;
}

export type Action<T extends string, P, M> =
    ActionUnit<T> |
    ActionPayload<T, P> |
    ActionPayloadMeta<T, P, M>;

export type ActionCreator<T extends string, P, M, Args extends Array<any>> =
    ((...args: Args) => Action<T, P, M>) &
    {
        type: T;
    };

function actionCreatorFn<T extends string, P, M, Args extends Array<any>>(
    type: T,
    toPayload: null | ((...args: Args) => P),
    toMeta: null | ((...args: Args) => M),
): ((...args: Args) => Action<T, P, M>) {
    if (toPayload && toMeta) {
        return (...args) => ({
            type,
            payload: toPayload(...args),
            meta: toMeta(...args),
        });
    } else if (toPayload) {
        return (...args) => ({
            type,
            payload: toPayload(...args),
        });
    } else if (toMeta) {
        return (...args) => ({
            type,
            meta: toMeta(...args),
        });
    } else {
        return () => ({ type });
    }
}

/**
 * Creates an annotated action creator which can be used with the various utility
 * methods to enforce type-safe action handling.
 *
 * @param type unique identifier for the action
 * @param toPayload function converting the action creator arguments into the `payload` property
 * @param toMeta function converting the action creator arguments into the `meta` property
 */
export function createAction<T extends string>(
    type: T,
): ActionCreator<T, void, void, Array<void>>;
export function createAction<T extends string, P, Args extends Array<any>>(
    type: T,
    toPayload: (...args: Args) => P,
): ActionCreator<T, P, void, Args>;
export function createAction<T extends string, P, M, Args extends Array<any>>(
    type: T,
    toPayload: null | ((...args: Args) => P),
    toMeta: (...args: Args) => M,
): ActionCreator<T, P, M, Args>;
export function createAction<T extends string, P, M, Args extends Array<any>>(
    type: T,
    toPayload: null | ((...args: Args) => P) = null,
    toMeta: null | ((...args: Args) => M) = null,
): ActionCreator<T, P, M, Args> {
    return Object.assign(actionCreatorFn(type, toPayload, toMeta), { type });
}
