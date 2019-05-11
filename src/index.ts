import { when, otherwise } from "./action-processor";

export {
    Action,
    createAction,
} from "./actions";
export const handle = {
    when,
    otherwise,
};
export {
    Reducer,
    createReducer,
    combineReducers,
} from "./reducers";
