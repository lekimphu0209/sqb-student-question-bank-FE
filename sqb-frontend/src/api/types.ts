export interface Pagination {
  before: string | null
  after: string | null
  has_prev: boolean
  has_next: boolean
}

export interface Author {
  id: number
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
