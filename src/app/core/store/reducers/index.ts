import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer
} from '@ngrx/store';
import { environment } from '../../../../environments/environment';

export function test(state, action) {
  return ``;
}

export interface State {
  test: string;
}

export const reducers: ActionReducerMap<State> = {
  test: test
};


export const metaReducers: MetaReducer<State>[] = !environment.production ? [] : [];
