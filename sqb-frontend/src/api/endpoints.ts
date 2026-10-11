import { get, post, put, del } from './client'
import type {
  AuthUser,
} from '@/store/auth'
import type {
  Comment,
  CursorPage,
  FeedItem,
  Post,
  Profile,
  ProposeQuestion,
  Subject,
  Submission,
} from './types'

// ---- Auth ----
export interface LoginBody {
  email: string
  password: string
  device_id: string
  platform: 'WEB'
  device_name?: string
  app_version?: string
}
export type LoginData = AuthUser & { access_token: string; refresh_token: string | null }
export const authApi = {
  login: (body: LoginBody) => post<LoginData>('/auth/login', body),
  logout: (refresh_token: string | null, device_id: string) =>
    post<null>('/auth/logout', { refresh_token, device_id }),
}

// ---- Users ----
export const userApi = {
  me: () => get<Profile>('/users/me'),
  byId: (id: number | string) => get<Profile>(`/users/${id}`),
  updateMe: (body: Partial<Pick<Profile, 'full_name' | 'bio' | 'avatar_url' | 'cover_url'>>) =>
    put<Profile>('/users/me', body),
}

// ---- Posts ----
export const postApi = {
  create: (body: { content: string; media_urls?: unknown[]; visibility: 'PUBLIC'; post_type: 'SOCIAL_POST' }) =>
    post<Post>('/posts', body),
  byId: (id: number | string) => get<Post>(`/posts/${id}`),
  update: (id: number | string, body: { content?: string; media_urls?: unknown[] }) =>
    put<Post>(`/posts/${id}`, body),
  remove: (id: number | string) => del<{ post_id: number }>(`/posts/${id}`),
  mine: (after?: string | null, limit = 10) => get<CursorPage<Post>>('/posts/me', { after, limit }),
  ofUser: (userId: number | string, after?: string | null, limit = 10) =>
    get<CursorPage<Post>>(`/users/${userId}/posts`, { after, limit }),
}

// ---- Feed ----
export const feedApi = {
  list: (after?: string | null, limit = 10) =>
    get<CursorPage<FeedItem>>('/activity-feeds', { after, limit }),
  newCount: (since: number) => get<{ total_new: number }>('/activity-feeds/new-count', { since }),
}

// ---- Comments / React ----
export const commentApi = {
  list: (target_type: 'POST' | 'SESSION' | 'QUESTION', target_id: number, after?: string | null, limit = 20) =>
    get<CursorPage<Comment>>('/comments', { target_type, target_id, after, limit }),
  create: (body: { target_type: 'POST' | 'SESSION' | 'QUESTION'; target_id: number; content: string; parent_comment_id?: number }) =>
    post<Comment>('/comments', body),
}
export const reactApi = {
  toggle: (target_type: 'POST' | 'SESSION' | 'QUESTION', target_id: number, reaction_type: 'LIKE' | 'NONE') =>
    post<{ my_reaction: string; total_count: number }>('/react', { target_type, target_id, reaction_type }),
}

// ---- Question bank ----
export const sessionApi = {
  enrolledSubjects: () => get<Subject[]>('/sessions/my-enrolled-subjects'),
  propose: (body: { title: string; content?: string; subject_id: number; questions: ProposeQuestion[] }) =>
    post<{ session_id: number; questions_count: number; status: string; duplicate_warnings: unknown[] | null }>(
      '/sessions/propose',
      body,
    ),
  mySubmissions: (after?: string | null, limit = 10) =>
    get<{ content?: Submission[]; items?: Submission[]; pagination: unknown }>('/sessions/my-submissions', { after, limit }),
}

export const subjectApi = {
  all: () => get<Subject[]>('/subjects'),
}
