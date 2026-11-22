import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { badgeApi, blockApi, convApi, followApi, friendApi, postApi, userApi } from '@/api/endpoints'
import type { CursorPage, FollowUser, Profile } from '@/api/types'
import { useAuthStore } from '@/store/auth'
import PostCard from '@/components/PostCard'
import ReportModal from '@/components/ReportModal'
import { Avatar, EmptyState, ErrorBox, Modal, Spinner } from '@/components/ui'
import { uploadImages } from '@/lib/upload'
import { useInfiniteScroll } from '@/lib/infiniteScroll'
import { toast } from '@/lib/toast'
import { Award, FileText, ImagePlus, MessageCircle, Pencil } from 'lucide-react'

// Nút hành động quan hệ trên profile người khác (BF-07)
function RelationActions({ userId }: { userId: number }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [reportOpen, setReportOpen] = useState(false)

  const stats = useQuery({ queryKey: ['rel-stats', userId], queryFn: () => followApi.stats(userId) })
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rel-stats', userId] })
    qc.invalidateQueries({ queryKey: ['profile'] })
  }

  const sendReq = useMutation({ mutationFn: () => friendApi.request(userId), onSuccess: invalidate })
  const acceptReq = useMutation({ mutationFn: () => friendApi.accept(userId), onSuccess: invalidate })
  const declineReq = useMutation({ mutationFn: () => friendApi.decline(userId), onSuccess: invalidate })
  const unfriend = useMutation({ mutationFn: () => friendApi.unfriend(userId), onSuccess: invalidate })
  const follow = useMutation({ mutationFn: () => followApi.follow(userId), onSuccess: invalidate })
  const unfollow = useMutation({ mutationFn: () => followApi.unfollow(userId), onSuccess: invalidate })
  const block = useMutation({ mutationFn: () => blockApi.block(userId), onSuccess: invalidate })
  const unblock = useMutation({ mutationFn: () => blockApi.unblock(userId), onSuccess: invalidate })
  const chat = useMutation({
    mutationFn: () => convApi.createDirect(userId),
    onSuccess: (c) => navigate(`/messages/${c.conversation_id}`),
  })
  if (stats.isPending) return <Spinner label="" />
  if (stats.isError) return null
  const r = stats.data.relationship_with_me
  const busy =
    sendReq.isPending || acceptReq.isPending || unfriend.isPending || follow.isPending ||
    unfollow.isPending || block.isPending || unblock.isPending || chat.isPending || declineReq.isPending

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {r.friend ? (
          <button className="btn-ghost" disabled={busy} onClick={() => unfriend.mutate()}>Huỷ kết bạn</button>
        ) : r.friend_request_status === 'PENDING' ? (
          <button className="btn-ghost" disabled={busy} onClick={() => declineReq.mutate()}>Huỷ lời mời</button>
        ) : r.friend_request_status === 'NONE' || r.friend_request_status === 'DECLINED' ? (
          <button className="btn-primary" disabled={busy} onClick={() => sendReq.mutate()}>+ Kết bạn</button>
        ) : (
          <button className="btn-primary" disabled={busy} onClick={() => acceptReq.mutate()}>Chấp nhận kết bạn</button>
        )}

        {r.following ? (
          <button className="btn-ghost" disabled={busy} onClick={() => unfollow.mutate()}>Bỏ theo dõi</button>
        ) : (
          <button className="btn-ghost" disabled={busy} onClick={() => follow.mutate()}>Theo dõi</button>
        )}

        <button className="btn-ghost" disabled={busy} onClick={() => chat.mutate()}><MessageCircle size={16} className="mr-1" />Nhắn tin</button>

        {r.blocked ? (
          <button className="btn-ghost text-danger" disabled={busy} onClick={() => unblock.mutate()}>Bỏ chặn</button>
        ) : (
          <button className="btn-ghost text-danger" disabled={busy} onClick={() => block.mutate()}>Chặn</button>
        )}
        <button className="btn-ghost" onClick={() => setReportOpen(true)}>Báo cáo</button>
      </div>
      {chat.isError && <p className="error-text">{(chat.error as Error).message}</p>}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="USER" targetId={userId} />
    </div>
  )
}

// Modal danh sách followers/following của chính mình (GET /follows/followers|following)
function FollowListModal({ tab, onClose }: { tab: 'followers' | 'following'; onClose: () => void }) {
  const q = useInfiniteQuery({
    queryKey: ['follow-list', tab],
    queryFn: ({ pageParam }): Promise<CursorPage<FollowUser>> =>
      tab === 'followers' ? followApi.followers(pageParam, 20) : followApi.following(pageParam, 20),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })
  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  return (
    <Modal open onClose={onClose} title={tab === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}>
      {q.isPending && <Spinner />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && items.length === 0 && <EmptyState>Chưa có ai.</EmptyState>}
      <div className="max-h-80 overflow-y-auto space-y-1">
        {items.map((u) => (
          <Link
            key={u.user_id}
            to={`/users/${u.user_id}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-bg"
          >
            <Avatar src={u.avatar_url} name={u.full_name} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{u.full_name}</div>
              <div className="text-xs text-textMuted truncate">
                {u.code}
                {u.school_faculty ? ` · ${u.school_faculty}` : ''}
              </div>
            </div>
            {u.friend && <span className="ml-auto text-xs text-success">Bạn bè</span>}
          </Link>
        ))}
      </div>
      {q.hasNextPage && (
        <button
          className="btn-ghost w-full text-sm"
          onClick={() => q.fetchNextPage()}
          disabled={q.isFetchingNextPage}
        >
          {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
        </button>
      )}
    </Modal>
  )
}

// Modal sửa hồ sơ của chính mình: tên, bio, avatar + cover (upload qua presign/upload trực tiếp)
function EditProfileModal({ profile, open, onClose }: { profile: Profile; open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [fullName, setFullName] = useState(profile.full_name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  async function save() {
    if (!fullName.trim()) return setError('Vui lòng nhập họ tên.')
    setSaving(true)
    setError(null)
    try {
      const body: { full_name: string; bio: string; avatar_url?: string; cover_url?: string } = {
        full_name: fullName.trim(),
        bio: bio.trim(),
      }
      if (avatarFile) body.avatar_url = (await uploadImages([avatarFile], 'AVATAR'))[0]
      if (coverFile) body.cover_url = (await uploadImages([coverFile], 'COVER'))[0]
      const updated = await userApi.updateMe(body)
      // Đồng bộ avatar vào auth store -> header cập nhật ngay
      const s = useAuthStore.getState()
      if (s.user && s.accessToken) {
        s.setAuth({ ...s.user, avatar_url: updated.avatar_url ?? s.user.avatar_url }, s.accessToken, s.refreshToken)
      }
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast('Đã cập nhật hồ sơ', 'success')
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url
  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : profile.cover_url

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa hồ sơ">
      <div className="space-y-4">
        <div
          className="h-24 rounded-md bg-primary/20 bg-cover bg-center relative"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})` } : {}}
        >
          <button
            className="absolute bottom-2 right-2 btn-ghost text-xs !py-1 !px-2 bg-card/80"
            onClick={() => coverRef.current?.click()}
          >
            <ImagePlus size={13} className="inline mr-1 -mt-0.5" />Ảnh bìa
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar src={avatarPreview} name={fullName} size={64} />
          <button className="btn-ghost text-sm" onClick={() => avatarRef.current?.click()}>
            <ImagePlus size={14} className="inline mr-1 -mt-0.5" />Đổi ảnh đại diện
          </button>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" hidden onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        <div>
          <label className="label">Họ tên *</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Giới thiệu</label>
          <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Vài dòng về bạn..." />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Huỷ</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ProfilePage() {
  const { userId } = useParams()
  const me = useAuthStore((s) => s.user)
  const isMe = !userId || Number(userId) === me?.user_id

  const profile = useQuery({
    queryKey: ['profile', isMe ? 'me' : userId],
    queryFn: () => (isMe ? userApi.me() : userApi.byId(userId!)),
  })

  const [editOpen, setEditOpen] = useState(false)
  const [followTab, setFollowTab] = useState<'followers' | 'following' | null>(null)

  const badges = useQuery({
    queryKey: ['badges', isMe ? 'me' : userId],
    queryFn: () => (isMe ? badgeApi.me() : badgeApi.ofUser(userId!)),
  })

  const posts = useInfiniteQuery({
    queryKey: ['my-posts', isMe ? 'me' : userId],
    queryFn: ({ pageParam }) => (isMe ? postApi.mine(pageParam) : postApi.ofUser(userId!, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })
  const sentinel = useInfiniteScroll(posts)

  if (profile.isPending) return <Spinner />
  if (profile.isError) return <ErrorBox error={profile.error} onRetry={() => profile.refetch()} />
  const p = profile.data
  const items = posts.data?.pages.flatMap((pg) => pg.items) ?? []

  const stats: [string, number | string][] = [
    ['Bạn bè', p.friends_count],
    ['Người theo dõi', p.followers_count],
    ['Đang theo dõi', p.following_count],
    ['Câu hỏi đề xuất', p.total_proposed_questions],
    ['Điểm', p.gamification_points],
    ['Huy hiệu', p.badges_count],
  ]

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="h-32 bg-primary/20" style={p.cover_url ? { backgroundImage: `url(${p.cover_url})`, backgroundSize: 'cover' } : {}} />
        <div className="px-4 pb-4">
          <div className="-mt-10 mb-2">
            <Avatar src={p.avatar_url} name={p.full_name} size={80} />
          </div>
          <h1 className="text-xl font-bold">{p.full_name}</h1>
          <p className="text-sm text-textMuted">
            {p.role} · {p.student_lecturer_code}
            {p.email && ` · ${p.email}`}
          </p>
          {p.bio && <p className="mt-2 text-sm">{p.bio}</p>}
          {isMe ? (
            <button className="btn-ghost mt-3" onClick={() => setEditOpen(true)}>
              <Pencil size={14} className="inline mr-1.5 -mt-0.5" />Chỉnh sửa hồ sơ
            </button>
          ) : (
            <RelationActions userId={Number(userId)} />
          )}
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {stats.map(([label, val]) => {
              const tab = label === 'Người theo dõi' ? 'followers' : label === 'Đang theo dõi' ? 'following' : null
              return isMe && tab !== null ? (
                <button
                  key={label}
                  className="bg-bg rounded-md py-2 hover:bg-border/60 transition"
                  onClick={() => setFollowTab(tab)}
                >
                  <div className="font-semibold">{val}</div>
                  <div className="text-xs text-textMuted">{label}</div>
                </button>
              ) : (
                <div key={label} className="bg-bg rounded-md py-2">
                  <div className="font-semibold">{val}</div>
                  <div className="text-xs text-textMuted">{label}</div>
                </div>
              )
            })}
          </div>
          {badges.data && badges.data.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Huy hiệu</div>
              <div className="flex flex-wrap gap-2">
                {badges.data.map((b) => (
                  <div
                    key={b.badge_id}
                    title={`${b.name} — ${b.description}`}
                    className="flex items-center gap-2 bg-bg rounded-md px-2 py-1.5"
                  >
                    {b.icon_url ? (
                      <img src={b.icon_url} alt="" className="w-7 h-7 object-contain" />
                    ) : (
                      <Award size={22} className="text-warning" />
                    )}
                    <div>
                      <div className="text-xs font-semibold">{b.name}</div>
                      <div className="text-[10px] uppercase text-textMuted">{b.badge_tier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <h2 className="font-semibold">Bài viết</h2>
      {posts.isPending && <Spinner />}
      {posts.isError && <ErrorBox error={posts.error} onRetry={() => posts.refetch()} />}
      {posts.isSuccess && items.length === 0 && <EmptyState icon={<FileText size={32} />}>Chưa có bài viết nào.</EmptyState>}
      {items.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}
      <div ref={sentinel} className="py-2 flex justify-center">
        {posts.isFetchingNextPage && <Spinner label="" />}
      </div>
      {isMe && <EditProfileModal profile={p} open={editOpen} onClose={() => setEditOpen(false)} />}
      {isMe && followTab && <FollowListModal tab={followTab} onClose={() => setFollowTab(null)} />}
    </>
  )
}
