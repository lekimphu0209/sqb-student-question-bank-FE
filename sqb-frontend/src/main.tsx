import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'
import Layout from '@/components/Layout'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import PostDetailPage from '@/pages/PostDetailPage'
import ProfilePage from '@/pages/ProfilePage'
import ProposePage from '@/pages/ProposePage'
import MySubmissionsPage from '@/pages/MySubmissionsPage'
import SubmissionDetailPage from '@/pages/SubmissionDetailPage'
import SearchPage from '@/pages/SearchPage'
import FriendsPage from '@/pages/FriendsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import MessagesPage from '@/pages/MessagesPage'
import ChatPage from '@/pages/ChatPage'
import BlockedPage from '@/pages/BlockedPage'
import PushSettingsPage from '@/pages/PushSettingsPage'
import DevicesPage from '@/pages/DevicesPage'
import PracticePage from '@/pages/PracticePage'
import GamesPage from '@/pages/GamesPage'
import LecturerReviewPage from '@/pages/LecturerReviewPage'
import LecturerReviewDetailPage from '@/pages/LecturerReviewDetailPage'
import ExamsPage from '@/pages/ExamsPage'
import ExamNewPage from '@/pages/ExamNewPage'
import VideosPage from '@/pages/VideosPage'
import { ErrorBox } from '@/components/ui'
import ToastHost from '@/components/Toast'
import { initTheme } from '@/lib/theme'
import './index.css'

// Áp theme (light/dark) trước khi render
initTheme()

function RequireAuth() {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireLecturer() {
  const role = useAuthStore((s) => s.user?.role)
  if (role === 'LECTURER' || role === 'ADMIN') return <Outlet />
  return <ErrorBox error={new Error('Trang này chỉ dành cho giảng viên.')} />
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/friends', element: <FriendsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/messages', element: <MessagesPage /> },
          { path: '/messages/:id', element: <ChatPage /> },
          { path: '/posts/:id', element: <PostDetailPage /> },
          { path: '/videos', element: <VideosPage /> },
          { path: '/me', element: <ProfilePage /> },
          { path: '/users/:userId', element: <ProfilePage /> },
          { path: '/questions/propose', element: <ProposePage /> },
          { path: '/questions/my-submissions', element: <MySubmissionsPage /> },
          { path: '/questions/my-submissions/:sessionId', element: <SubmissionDetailPage /> },
          { path: '/sessions/:id/practice', element: <PracticePage /> },
          { path: '/games', element: <GamesPage /> },
          { path: '/settings/blocked', element: <BlockedPage /> },
          { path: '/settings/push', element: <PushSettingsPage /> },
          { path: '/settings/devices', element: <DevicesPage /> },
          {
            element: <RequireLecturer />,
            children: [
              { path: '/lecturer/review', element: <LecturerReviewPage /> },
              { path: '/lecturer/review/:sessionId', element: <LecturerReviewDetailPage /> },
              { path: '/lecturer/exams', element: <ExamsPage /> },
              { path: '/lecturer/exams/new', element: <ExamNewPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastHost />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
