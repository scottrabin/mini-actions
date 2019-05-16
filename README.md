# mini-actions

Helper utilities for a typesafe Redux experience.

[![CircleCI](https://circleci.com/gh/scottrabin/mini-actions/tree/master.svg?style=shield)](https://circleci.com/gh/scottrabin/mini-actions/tree/master)
[![codecov](https://codecov.io/gh/scottrabin/mini-actions/branch/master/graph/badge.svg)](https://codecov.io/gh/scottrabin/mini-actions)
[![dependencies Status](https://david-dm.org/scottrabin/mini-actions/status.svg)](https://david-dm.org/scottrabin/mini-actions)
[![devDependencies Status](https://david-dm.org/scottrabin/mini-actions/dev-status.svg)](https://david-dm.org/scottrabin/mini-actions?type=dev)

<!-- START doctoc -->
<!-- END doctoc -->

## Installation
```
$ npm install mini-actions
```

## Usage

Create actions and reducers which respond to specified actions via the `createAction`,
`createReducer`, and `combineReducer` functions.

```js
import * as actions from "mini-actions";

const moveX = actions.createAction("move x", (value: number) => value);
const moveY = actions.createAction("move y", (value: number) => value);
const unrelatedAction = actions.createAction("this can't be passed to the reducer");

const posX = actions.createReducer(0).when(moveX, (state, { payload }) => state + payload);
const posY = actions.createReducer(0).when(moveY, (state, { payload }) => state + payload);
const position = actions.combineReducers({ x: posX, y: posY });

const result = position({ x: 3, y: 4 }, moveX(5)); // => { x: 8, y: 4 };
// the following line will yield a type error
// const result = position({ x: 0, y: 0}, unrelatedAction());
```

Additionally, the `when` and `otherwise` helpers will create well-typed functions
which respond to specific actions created via this library. This may be useful in
custom middlewares, which often translate actions into imperative behavior.

```js
import { createAction, handle } from "mini-actions";
/* global store */

const apiSuccess = createAction("api success", (response: APIResponse) => response);
const performAPIRequest = createAction(
    "api request",
    (url: URL, headers?: Headers) => ({ url, headers }),
    () => ({
        onSuccess: apiSuccess,
    }));
const handler = handle.when(performAPIRequest, action => {
    fetch(action.payload.url.toString(), { headers: action.payload.headers }).
        then(response => response.json()).
        then(json => store.dispatch(action.meta.onSuccess(json)));
});

handler(performAPIRequest(new URL("https://api.thecatapi.com/v1/images/search?size=full")));
```

## API

### `createAction`

```js
function createAction<Type extends string, Payload, Metadata, Args = [Payload]>(
    type: Type,
    toPayload?: (...args: Args) => Payload,
    toMeta?: (...args: Args) => Metadata
): ActionCreator<Type, Payload, Metadata, Args>;
```

Creates a new `ActionCreator` with the associated type and payload + metadata definitions. The
`ActionCreator` is an enhanced function meant to be used with `createReducer` and `handle` to
ensure types are correctly propagated through your reducers and action handlers.

The `type` argument must be a string literal, and cannot be correctly inferred at compile time
unless a type cast is used.

Both `toPayload` and `toMeta` are optional, and if omitted, will result in the created actions
not having the respective properties `payload` and `meta`. Additionally, these arguments must
take the same arguments to ensure the action creator signature stays consistent.

#### Examples

```js
export const moveBy = createAction("my action type", (x: number, y: number) => ({ x, y }));

const action = moveBy(1, 2); // { type: "my action type", payload: { x: 1, y: 2 }}
store.dispatch(action);

export const timeTrackedAction = createAction("the metadata is important", null, () => ({ time: Date.now() }));
const action = timeTrackedAction(); // { type: "the metadata is important", meta: { time: 1234567890} }

// incorrect action definition
const prefix = "@my-actions";
export const userDidSomething(`${prefix}/user did something`); // Type is inferred to `string` instead of the literal "@my-actions/user did something"
```

### createReducer

```js
function createReducer<State>(initialState: State): ReducerCreator<S, never>;
```

Creates a new reducer seeded with the provided initial state, which is used when
the reducer receives an `undefined` first argument. This reducer handles no actions;
to define transformations predicated on the actions received, use the [`when`](#reducercreator.when)
method of `ReducerCreator`.

### combineReducers

```js
function combineReducers<ReducerMap extends { [property: string]: Reducer }>(
    reducers: ReducerMap,
): Reducer<{ [property in keyof ReducerMap]: ReturnType<Reducer[property]>}, Parameters<ReducerMap[keyof ReducerMap]>[1]>
```

Combines the provided reducers into a tree, where the shape is defined by the key:value
mapping provided in the call to `combineReducers` and the set of actions handled
is the union of all actions handled by each reducer in the mapping. Similar to
the `combineReducers` function provided by Redux, with modifications to make use
of the enhanced action creators and reducers for type safety.

#### Usage

```js
import { createReducer, createAction } from "mini-actions";

const moveX = createAction("move x", (value: number) => value);
const moveY = createAction("move y", (value: number) => value);
const unrelatedAction = createAction("unrelated");

const xReducer: Reducer<number, ReturnType<moveX>> =
    createReducer(0).when(moveX, (state, { payload }) => state + payload);
const yReducer: Reducer<number, ReturnType<moveY>> =
    createReducer(0).when(moveY, (state, { payload }) => state + payload);
const positionReducer: Reducer<{x: number, y: number}, ReturnType<moveX> | ReturnType<moveY>> = combineReducers({
    x: xReducer,
    y: yReducer,
});

const moved = [moveX(3), moveY(4)].reduce(positionReducer, undefined); // { x: 3, y: 4 }
// the following line is a compile-time error because none of the individual reducers
// define a transform for the provided action
// const _ = positionReducer(moved, unrelatedAction);
```

### handle

```js
export const handle = {
    when: <Type extends string, Payload, Metadata, ReturnValue>(
        actionCreator: ActionCreator<Type, Payload, Metadata, any>,
        fn: (action: Action<Type, Payload, Metadata>) => ReturnValue,
    ) => ActionHandler<((action: Action<Type, Payload, Metadata>) => ReturnValue), never>;
    otherwise: <ReturnValue>(
        fn: (action: Action<string, unknown, unknown>) => ReturnValue,
    ) => ActionHandler<never, ((action: Action<string, unknown, unknown>) => ReturnValue)>;
};
```

The `handle` object allows defining custom functions which use the enhanced
action creators to create a type-safe function accepting a union of any of the
provided actions, and returns the result of those functions. At this time, only
functions of arity 1 are able to be created.

While the top level object itself only provides helper methods for creating basic
functions capable of handling a single action, the returned `ActionHandler` type
offers the same methods to build a function capable of handling multiple actions.

The `when` method adds a specific `Action` handler that only runs when that `Action`
is received, and the parameterized return type of this function is added to the
set of overloads on the returned function.

The `otherwise` method _replaces_ the existing fallback action handler, which
receives any action not specifically handled with a generalized `string` for its
`type` field and `unknown` for both the `payload` and `meta` field.

Like the [`when`](#reducercreator.when) method on `ReducerCreator`s, these methods
return new functions with the provided signature, so that logic may be shared
between various handlers.

#### Usage

```js
import { createAction, handle } from "mini-actions";

const trackThisAction = createAction("user clicked a button", (button: HTMLButtonElement) => button.getAttribute("id"));
const otherAction = createAction("this affects a different part of your program");

const handler = handle.when(trackThisAction, ({ payload }) => {
    navigator.sendBeacon("https://your.telemetry.endpoint", {
        event: "button click",
        data: {
            id: payload.id,
        },
    });

    return true;
}).otherwise(() => false);

const didTrack = handler(trackThisAction(document.getElementById("form-submit"))); // true
const didntTrack = handler(otherAction()); // false
```

### ReducerCreator.when

```js
declare reducerCreator: ReducerCreator<State, Actions>;

reducerCreator.when = <Type extends string, Payload, Metadata>(
    actionCreator: ActionCreator<Type, Payload, Metadata, any>,
    reducer: Reducer<State, Action<Type, Payload, Metadata>>,
): ReducerCreator<State, Actions | Action<Type, Payload, Metadata>>;
```

Defines a new transformation applied when the reducer creator is passed actions
created by the provided action creator. This operation returns a new reducer creator
without in-place modification of the original object, allowing reducers to share
logic without interfering with other definitions.

#### Usage

```js
import { createAction, createReducer } from "mini-actions";

const moveX = createAction("move x", (by: number) => by);
const moveY = createAction("move y", (by: number) => by);
const unhandled = createAction("a different action");
const reducer = createReducer({ x: 0, y: 0}).
    when(moveX, (state, { payload }) => ({ x: state.x + payload, y: state.y })).
    when(moveY, (state, { payload }) => ({ x: state.x, y: state.y + payload }));

const movedX = reducer(undefined, moveX(3)); // { x: 3, y: 0 }
const movedY = reducer(movedX, moveY(-4)); // { x: 3, y: -4 }
// the following line is a compile-time error because this reducer does not have
// a transformation defined for the provided action
// const _ = reducer(movedY, unhandled());
```
