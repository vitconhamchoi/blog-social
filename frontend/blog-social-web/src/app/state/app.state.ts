import { createAction, createFeature, createReducer, on, props } from '@ngrx/store';
import { Post, User } from '../models';

export interface FeedState {
  posts: Post[];
  loading: boolean;
}

export interface AuthState {
  user: User | null;
}

const initialFeedState: FeedState = { posts: [], loading: false };
const initialAuthState: AuthState = { user: null };

export const feedLoad = createAction('[Feed] Load');
export const feedLoadSuccess = createAction('[Feed] Load Success', props<{ posts: Post[] }>());
export const authSetUser = createAction('[Auth] Set User', props<{ user: User | null }>());

export const feedFeature = createFeature({
  name: 'feed',
  reducer: createReducer(
    initialFeedState,
    on(feedLoad, (state) => ({ ...state, loading: true })),
    on(feedLoadSuccess, (_, { posts }) => ({ posts, loading: false }))
  )
});

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(authSetUser, (_, { user }) => ({ user }))
  )
});
