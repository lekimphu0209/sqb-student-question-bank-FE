export interface Pagination {
  before: string | null
  after: string | null
  has_prev: boolean
  has_next: boolean
}

export interface Author {
  user_id: number
  full_name: string
  avatar_url: string
  frame_url: string
}

export interface Post {
  post_id: number
  content: string
  media_urls: string[]
  author: Author
  react_count: number
  comment_count: number
  reacted_by_me: boolean
  is_edited?: boolean
  created_at: string
  post_type?: string
  subject_name?: string
}

export interface FeedItem {
  target_type: string
  target_id: number
  actor: Author
  action_type: string
  content: Record<string, unknown>
  created_at: string
  weight?: number
}

export interface CursorPage<T> {
  items: T[]
  pagination: Pagination
}

export interface Comment {
  comment_id: number
  parent_comment_id: number | null
  content: string | null
  media_url: string | null
  author: Author | null
  created_at: string
  hidden: boolean
  replies: Comment[] | null
}

export interface Profile {
  user_id: number
  email?: string
  full_name: string
  avatar_url: string
  cover_url: string
  frame_url: string
  bio: string
  school_faculty: string
  major: string
  student_lecturer_code: string
  role: string
  total_proposed_questions: number
  gamification_points: number
  badges_count: number
  friends_count: number
  followers_count: number
  following_count: number
  created_at: string
}

export interface Subject {
  subject_id: number
  code: string
  name: string
}

export interface QuestionOption {
  key: string
  text: string
  is_correct: boolean
}

export interface ProposeQuestion {
  content: string
  options: QuestionOption[]
  explanation?: string
  llm_generated: boolean
  confidence?: number
}

export interface Submission {
  session_id: number
  subject_id: number
  subject_name: string
  question_counts?: number
  questions_count?: number
  status?: string
  created_at: string
  react_count?: number
  comment_count?: number
}

// ---- Auth refresh ----
export interface RefreshTokenData {
  access_token: string
  refresh_token: string
}

// ---- Search ----
export type SearchType = 'ALL' | 'POST' | 'USER' | 'QUESTION' | 'SESSION' | 'SUBJECT'

export interface UserSearchResult {
  user_id: number
  full_name: string
  student_lecturer_code: string
  email: string
  bio: string
  avatar_url: string
  avatar_frame_url: string
  school_faculty: string
  major: string
  role: string
  total_proposed_questions: number
  badges_count: number
  followers_count: number
}

export interface PostSearchResult {
  post_id: number
  content: string
  author_id: number
  author_name: string
  author_avatar_url: string
  post_type: string
  media_urls: string[]
  react_count: number
  comment_count: number
  created_at: string
}

export interface QuestionSearchResult {
  question_id: number
  question_code: string
  subject_id: number
  subject_name: string
  topic_name: string
  status: string
  difficulty: string
  content: string
  explanation: string
  image_urls: string[]
  avg_rating: number
  rating_count: number
  react_count: number
  comment_count: number
  created_at: string
}

export interface SessionSearchResult {
  session_id: number
  title: string
  content: string
  subject_id: number
  subject_name: string
  status: string
  question_count: number
  react_count: number
  comment_count: number
  created_at: string
}

export interface SearchResultItem {
  type: SearchType
  relevance_score: number
  post?: PostSearchResult
  user?: UserSearchResult
  question?: QuestionSearchResult
  session?: SessionSearchResult
  subject?: { subject_id: number; code: string; name: string }
}

export interface SearchResponse {
  items: SearchResultItem[]
  pagination: Pagination
  total_hits: number
}

export interface SavedSearch {
  saved_search_id: number
  query_text: string
  last_searched_at: string
}

export interface SavedAndTrending {
  saved_searches: SavedSearch[]
  trending_searches: string[]
}

// ---- Notifications ----
export interface NotificationItem {
  notification_id: number
  type: string
  title: string
  body: string
  icon_url: string
  read_at: string | null
  created_at: string
  target: { type: string; target_id: number; url: string }
  actor: Author
}

export interface NotificationList {
  items: NotificationItem[]
  pagination: Pagination
  unread_count: number
}

// ---- Chat ----
export interface LastMessage {
  message_id: number
  content: string
  message_type: string
  created_at: string
}

export interface Conversation {
  conversation_id: number
  type: 'DIRECT' | 'GROUP'
  display_name: string
  display_avatar_url: string
  member_count: number
  last_message: LastMessage | null
  unread_count: number
  hidden_at: string | null
  updated_at: string
  muted: boolean
}

export interface ConversationList {
  items: Conversation[]
  pagination: Pagination
  total_conversations: number
}

export interface ReplyPreview {
  message_id: number
  sender_id: number
  sender_name: string
  content_preview: string
}

export interface ChatMessage {
  message_id: number
  sender_id: number
  sender_name: string
  avatar_url: string
  frame_url: string
  content: string
  message_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'GIF'
  media_urls: string[]
  reply_to_message: ReplyPreview | null
  created_at: string
  edited: boolean
  revoked: boolean
}

export interface MessageList {
  conversation_id: number
  conversation_type: 'DIRECT' | 'GROUP'
  messages: ChatMessage[]
  pagination: Pagination
}

// ---- Friendships / Follows / Blocks ----
export interface FriendItem {
  user_id: number
  full_name: string
  avatar_url: string
  frame_url: string
  friends_since: string
  mutual_friends_count: number
}

export interface FriendRequest {
  user: Author
  status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED'
  created_at: string
  mutual_friends_count: number
}

export interface FriendsPage {
  items: FriendItem[]
  pagination: Pagination
  total_friends: number
}

export interface FriendRequestsPage {
  items: FriendRequest[]
  pagination: Pagination
  total_pending?: number
  total_sent?: number
}

export interface FollowUser {
  user_id: number
  full_name: string
  avatar_url: string
  frame_url: string
  role: string
  school_faculty: string
  code: string
  friend: boolean
}

export interface BlockedUser {
  user_id: number
  full_name: string
  avatar_url: string
  frame_url: string
  blocked_at: string
}

export interface RelationshipStats {
  user_id: number
  counts: { followers_count: number; following_count: number; friends_count: number }
  relationship_with_me: {
    friend_request_status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED'
    friend: boolean
    followed_by: boolean
    following: boolean
    blocked: boolean
  }
}

// ---- Media ----
export type MediaPurpose = 'AVATAR' | 'COVER' | 'QUESTION' | 'POST' | 'COMMENT' | 'CHAT' | 'DOCUMENT'

export interface PresignFile {
  file_name: string
  file_size: number
  content_type: string
  purpose: MediaPurpose
}

export interface PresignedUrl {
  object_key: string
  upload_url: string
  public_url: string
  expires_in_seconds: number
}

export interface MediaUploadResult {
  object_key: string
  url: string
  file_size: number
  content_type: string
  media_type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
}

// ---- Practice / Question interaction ----
export interface PracticeOption {
  key: string
  text: string
  media_url?: string
  is_correct?: boolean
}

export interface PracticeQuestion {
  question_id: number
  question_code: string
  content: string
  image_urls: string[]
  options: PracticeOption[]
  source: 'LLM' | 'HOMO_SAPIENS'
  created_at: string
  updated_at: string
  my_interaction: { answered: boolean; rated: boolean }
  hidden_fields: { correct_answer?: string; explanation?: string } | null
  react_count: number
  comment_count: number
  rating_count: number
}

export interface SessionQuestions {
  session_id: number
  session_code: string
  title: string
  content: string
  subject_id: number
  subject_name: string
  subject_code: string
  total_questions: number
  questions: PracticeQuestion[]
}

export interface AnswerResult {
  is_correct: boolean
  correct_answer: string
  explanation: string
}

export interface RateResult {
  new_avg_rating: number
  new_rating_count: number
}

export interface QuestionStats {
  total_answer: number
  correct_rate: number
  option_distribution: Record<string, number>
  rating_summary: { avg_rating: number; total_ratings: number; distribution: Record<string, number> }
}

export interface SubmissionQuestion {
  question_id: number
  content: string
  image_urls: string[]
  options: PracticeOption[]
  explanation: string
  source: 'LLM' | 'HOMO_SAPIENS'
  confidence_score: number
  comment_count: number
  react_count: number
  rating_count: number
}

export interface SubmissionDetail {
  session_id: number
  session_code: string
  title: string
  content: string
  subject_id: number
  subject_name: string
  subject_code: string
  comment_count: number
  react_count: number
  reviewed_by_lecturer: string
  reviewed_at: string
  created_at: string
  questions: SubmissionQuestion[]
}

// ---- Lecturer review ----
export interface PendingSession {
  session_id: number
  topic: string
  title: string
  content: string
  author: Author
  status: string
  created_at: string
}

export interface ReviewQuestion {
  question_id: number
  content: string
  image_urls: string[]
  options: PracticeOption[]
  correct_answer: string
  explanation: string
  status: string
}

export interface SessionReview {
  items: ReviewQuestion[]
  duplicate_warnings: { question_id: number; similar_question_id: number; similarity_score?: number }[]
}

// ---- Exams ----
export interface ExamItem {
  exam_id: number
  title: string
  subject_name: string
  question_count: number
  created_at: string
  statistic: { easy_count: number; medium_count: number; hard_count: number; unclassified_count: number }
  download_url: string
}

export interface ExamExport {
  download_url: string
  file_size_mb: number
  questions_count: number
  expires_at: string
}

export interface CourseClass {
  course_class_id: number
  class_code: string
  subject_id: number
  subject_code: string
  subject_name: string
  semester_name: string
  lecturer_name: string
  total_students: number
}

// ---- Games / Gamification ----
export interface CheckInStatus {
  current_streak: number
  has_checked_in_today: boolean
  last_check_in_date: string
  today: string
}

export interface CheckInResult {
  coin_earned: number
  current_coin_balance: number
  current_streak: number
  check_in_date: string
  message: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: number
  user_code: string
  full_name: string
  avatar_url: string
  frame_url: string
  total_points: number
  is_current_user: boolean
}

export interface Leaderboard {
  entries: LeaderboardEntry[]
  my_rank: {
    rank: number
    total_points: number
    top_percent: number
    total_participants: number
    full_name: string
    avatar_url: string
    frame_url: string
  } | null
  pagination: Pagination
}

export interface GamePrediction {
  prediction_id: number
  game_type: string
  target_type: string
  target_id: number
  prediction_data: Record<string, unknown>
  actual_data: Record<string, unknown> | null
  status: 'PENDING' | 'RESOLVED'
  is_correct: boolean | null
  created_at: string
  resolved_at: string | null
}

export interface MyBadge {
  badge_id: number
  name: string
  description: string
  badge_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  icon_url: string
  earned_at: string
}

// ---- Devices / Push / Report ----
export interface Device {
  user_device_id: number
  device_id: string
  device_name: string
  platform: string
  os_version: string
  app_version: string
  last_active_at: string
  is_active: boolean
  is_current_device: boolean
}

export interface QuietHours {
  enabled: boolean
  start_time: string
  end_time: string
}

export interface PushSettings {
  push_enabled: boolean
  categories: Record<string, { enabled: boolean; description: string }>
  quiet_hours: QuietHours
  sound_enabled: boolean
  vibration_enabled: boolean
}

export interface ReportBody {
  violation_type: 'HARASSMENT' | 'HATE_STATEMENT' | 'SPAM' | 'OTHER'
  description?: string
  evidence_urls?: string[]
  target_type: 'POST' | 'COMMENT' | 'USER'
  target_id: number
}

// ---- Video posts (video bài giảng của giảng viên) ----
export interface MediaItem {
  key: string
  url: string
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  width?: number
  height?: number
  size?: number
  duration?: number
  name?: string
  thumbnail_url?: string
}

export interface VideoPostItem {
  post_id: number
  content: string
  visibility: 'PUBLIC' | 'ONLY_ME' | 'FRIENDS'
  react_count: number
  comment_count: number
  media_urls: MediaItem[]
  author: Author
  created_at: string
  updated_at?: string
  subject_id?: number
  subject_name?: string
  subject_code?: string
}
