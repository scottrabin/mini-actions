type OptionalProperty<T, P extends {}> =
    (T extends void
        ? unknown
        : (unknown extends T
            ? { [K in keyof P]?: unknown }
            : { [K in keyof P]: T }));

export type Action<T extends string, P, M> =
    { type: T } &
    OptionalProperty<P, { payload: P }> &
    OptionalProperty<M, { meta: M }>;

export type ActionCreator<T extends string, P, M, Args extends Array<any>> =
    ((...args: Args) => Action<T, P, M>) &
    {
        type: T;
    };

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
    let fn: (...args: Args) => any;
    if (toPayload && toMeta) {
        fn = (...args) => ({ type, payload: toPayload(...args), meta: toMeta(...args) });
    } else if (toPayload) {
        fn = (...args) => ({ type, payload: toPayload(...args) });
    } else if (toMeta) {
        fn = (...args) => ({ type, meta: toMeta(...args) });
    } else {
        fn = () => ({ type });
    }
    return Object.assign(fn, { type });
}
