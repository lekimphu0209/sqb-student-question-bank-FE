import { api, get, post, put, del } from './client'
import type {
  AuthUser,
} from '@/store/auth'
import type {
  AnswerResult,
  BlockedUser,
  ChatMessage,
  CheckInResult,
  CheckInStatus,
  Comment,
  Conversation,
  ConversationList,
  CourseClass,
  CursorPage,
  Device,
  ExamExport,
  ExamItem,
  FeedItem,
  FriendItem,
  FriendsPage,
  FriendRequestsPage,
  FollowUser,
  GamePrediction,
  Leaderboard,
  MediaPurpose,
  MediaUploadResult,
  MessageList,
  MyBadge,
  NotificationList,
  PendingSession,
  Post,
  PracticeQuestion,
  PresignFile,
  PresignedUrl,
  Profile,
  ProposeQuestion,
  PushSettings,
  QuestionStats,
  RateResult,
  RefreshTokenData,
  RelationshipStats,
  ReportBody,
  ReviewQuestion,
  SavedAndTrending,
  SearchResponse,
  SearchType,
  SessionQuestions,
  SessionReview,
  Subject,
  Submission,
  SubmissionDetail,
  VideoPostItem,
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
  refresh: (refresh_token: string) => post<RefreshTokenData>('/auth/refresh', { refresh_token }),
  changePassword: (old_password: string, new_password: string) =>
    post<null>('/auth/change-password', { old_password, new_password }),
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

// ---- Video posts (video bài giảng, GET /video-posts, limit tối đa 3) ----
export const videoApi = {
  list: (subject_id?: number, after?: string | number | null, limit = 3) =>
    get<CursorPage<VideoPostItem>>('/video-posts', { subject_id, after, limit }),
}

// ---- Comments / React ----
export const commentApi = {
  list: (target_type: 'POST' | 'SESSION' | 'QUESTION', target_id: number, after?: string | null, limit = 20) =>
    get<CursorPage<Comment>>('/comments', { target_type, target_id, after, limit }),
  create: (body: {
    target_type: 'POST' | 'SESSION' | 'QUESTION'
    target_id: number
    content: string
    parent_comment_id?: number
    media_urls?: string[]
  }) => post<Comment>('/comments', body),
  update: (comment_id: number, body: { content: string }) => put<Comment>(`/comments/${comment_id}`, body),
  remove: (comment_id: number) => del<null>(`/comments/${comment_id}`),
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

// ---- Search ----
export const searchApi = {
  run: (query: string, type: SearchType = 'ALL', after?: string | number | null, limit = 10) =>
    get<SearchResponse>('/search', { query, type: type === 'ALL' ? undefined : type, after, limit }),
  saved: () => get<SavedAndTrending>('/search/saved'),
  removeSaved: (id: number) => del<null>(`/search/saved/${id}`),
}

// ---- Friendships ----
export const friendApi = {
  list: (after?: string | number | null, limit = 20) => get<FriendsPage>('/friendships', { after, limit }),
  request: (addressee_id: number) => post<null>('/friendships/request', { addressee_id }),
  accept: (requester_id: number) => post<null>('/friendships/accept', { requester_id }),
  decline: (requester_id: number) => post<null>('/friendships/decline', { requester_id }),
  unfriend: (friend_id: number) => del<null>(`/friendships/${friend_id}`),
  received: (after?: string | number | null, limit = 20) =>
    get<FriendRequestsPage>('/friendships/requests/received', { after, limit }),
  sent: (after?: string | number | null, limit = 20) =>
    get<FriendRequestsPage>('/friendships/requests/sent', { after, limit }),
}

// ---- Follows ----
export const followApi = {
  follow: (target_user_id: number) =>
    post<{ following: boolean; new_followers_count: number }>(`/follows/${target_user_id}`),
  unfollow: (target_user_id: number) => del<null>(`/follows/${target_user_id}`),
  followers: (after?: string | number | null, limit = 20) =>
    get<CursorPage<FollowUser> & { total_followers: number }>('/follows/followers', { after, limit }),
  following: (after?: string | number | null, limit = 20) =>
    get<CursorPage<FollowUser> & { total_following: number }>('/follows/following', { after, limit }),
  stats: (user_id: number | string) => get<RelationshipStats>(`/users/${user_id}/relationship-stats`),
}

// ---- Blocks ----
export const blockApi = {
  list: (after?: string | number | null, limit = 20) =>
    get<CursorPage<BlockedUser> & { total_blocked: number }>('/blocks', { after, limit }),
  block: (target_user_id: number) => post<null>(`/blocks/${target_user_id}`),
  unblock: (target_user_id: number) => del<null>(`/blocks/${target_user_id}`),
}

// ---- Report ----
export const reportApi = {
  create: (body: ReportBody) => post<{ report_id: number; status: string }>('/report', body),
}

// ---- Notifications ----
export const notiApi = {
  list: (after?: string | number | null, limit = 15) => get<NotificationList>('/notifications', { after, limit }),
  read: (id: number) => post<null>(`/notifications/${id}/read`),
  readAll: () => post<null>('/notifications/read-all'),
}

// ---- Conversations / Messages ----
export const convApi = {
  list: (after?: string | number | null, limit = 20) => get<ConversationList>('/conversations', { after, limit }),
  createDirect: (target_user_id: number) => post<Conversation>('/conversations/direct', { target_user_id }),
  messages: (conversation_id: number | string, after?: string | number | null, limit = 30) =>
    get<MessageList>(`/conversations/${conversation_id}/messages`, { after, limit }),
  deleteMessage: (message_id: number, scope: 'ME' | 'EVERYONE') =>
    del<null>(`/messages/${message_id}`, { scope }),
}

// ---- Media upload (presign -> PUT R2 -> verify, fallback /medias/upload) ----
export const mediaApi = {
  presign: (files: PresignFile[]) =>
    post<{ presigned_urls: PresignedUrl[] }>('/medias/presign', { files }),
  verify: (urls: string[]) => post<{ missing_urls: string[] }>('/medias/verify', { urls }),
  uploadDirect: async (file: File, purpose: MediaPurpose): Promise<MediaUploadResult> => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post<{ code: string; message: string; data: MediaUploadResult }>(
      '/medias/upload',
      form,
      { params: { purpose }, headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data.data
  },
}

// ---- Practice & question interaction ----
export const practiceApi = {
  questions: (session_id: number | string) => get<SessionQuestions>(`/sessions/${session_id}/questions`),
  answer: (question_id: number, selected_options: string[], question_updated_at?: string) =>
    post<AnswerResult>(`/questions/${question_id}/answer`, { selected_options, question_updated_at }),
  rate: (question_id: number, rating: number, is_error = false, comment?: string) =>
    post<RateResult>(`/questions/${question_id}/rate`, { rating, is_error, comment }),
  statistics: (question_id: number) => get<QuestionStats>(`/questions/${question_id}/statistics`),
  reactQuestion: (question_id: number, reaction_type: 'LIKE' | 'NONE') =>
    post<{ my_reaction: string; total_count: number }>('/react', {
      target_type: 'QUESTION',
      target_id: question_id,
      reaction_type,
    }),
}

// ---- Submission detail (student) ----
export const submissionApi = {
  detail: (session_id: number | string) => get<SubmissionDetail>(`/sessions/my-submissions/${session_id}`),
  remove: (session_id: number | string) => del<null>(`/sessions/my-submissions/${session_id}`),
}

// ---- Lecturer: review / exams / classes ----
export const reviewApi = {
  pending: (after?: string | number | null, limit = 10, subject_id?: number, sort_by?: string) =>
    get<CursorPage<PendingSession>>('/sessions/pending', { after, limit, subject_id, sort_by }),
  detail: (session_id: number | string) => get<SessionReview>(`/sessions/${session_id}`),
  approve: (question_ids: number[]) => post<null>('/sessions/approve', { question_ids }),
  reject: (question_ids: number[], reason: string) =>
    post<null>('/sessions/reject', { question_ids, reason }),
  completeReview: (session_id: number | string) => post<null>(`/sessions/${session_id}/complete-review`),
  editQuestion: (question_id: number, body: Partial<PracticeQuestion>) =>
    put<null>(`/questions/${question_id}`, body),
}

export const classApi = {
  myClasses: () => get<CourseClass[]>('/lecturer/course-classes/my-classes'),
}

export const examApi = {
  myExams: (after?: string | number | null, limit = 10, subject_id?: number) =>
    get<CursorPage<ExamItem>>('/exams/my-exams', { after, limit, subject_id }),
  generate: (body: {
    subject_id: number
    title?: string
    question_count?: number
    difficulty_distribution?: Record<string, number>
    topic_weights?: Record<string, number>
    shuffle_options?: boolean
    include_answer_key?: boolean
    class_ids: number[]
  }) => post<{ exam_id: number }>('/exams/generate', body),
  export: (exam_id: number, format: 'PDF' | 'EXCEL', include_answer_key = true) =>
    get<ExamExport>(`/exams/${exam_id}/export`, { format, include_answer_key }),
  exportBank: (subject_id?: number) => get<ExamExport>('/lecturer/questions/export', { subject_id }),
}

// ---- Games / gamification ----
export const gameApi = {
  checkInStatus: () => get<CheckInStatus>('/games/check-in'),
  checkIn: () => post<CheckInResult>('/games/check-in'),
  leaderboard: (period: 'SEMESTER' | 'SUBJECT' = 'SEMESTER', subject_id?: number, after?: string | number | null, limit = 20) =>
    get<Leaderboard>('/games/leaderboard', { period, subject_id, after, limit }),
  myPredictions: (after?: string | number | null, limit = 20) =>
    get<{ contents: GamePrediction[]; pagination: unknown }>('/games/my-predictions', { after, limit }),
}

export const badgeApi = {
  me: () => get<MyBadge[]>('/badges/me'),
  ofUser: (user_id: number | string) => get<MyBadge[]>(`/badges/users/${user_id}`),
}

// ---- Devices / Push settings ----
export const deviceApi = {
  list: () => get<{ devices: Device[] }>('/devices'),
  logoutDevice: (user_device_id: number) => post<null>(`/devices/${user_device_id}/logout`),
  remove: (user_device_id: number) => del<null>(`/devices/${user_device_id}`),
}

export const pushApi = {
  get: () => get<PushSettings>('/settings/push'),
  update: (body: PushSettings) => put<PushSettings>('/settings/push', body),
}

// Re-exports for convenient page imports
export type { ChatMessage, FriendItem }
