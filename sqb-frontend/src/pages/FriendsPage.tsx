import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blockApi, friendApi } from '@/api/endpoints'
import type { Author, FriendItem } from '@/api/types'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, Tabs, timeAgo } from '@/components/ui'

const TABS = [
  { key: 'friends', label: 'Bạn bè' },
  { key: 'received', label: 'Lời mời đã nhận' },
  { key: 'sent', label: 'Đã gửi' },
]

function PersonRow({
  user,
  sub,
  actions,
}: {
  user: Pick<Author, 'user_id' | 'full_name' | 'avatar_url'>
  sub?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="card flex items-center gap-3">
      <Link to={`/users/${user.user_id}`}>
        <Avatar src={user.avatar_url} name={user.full_name} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/users/${user.user_id}`} className="font-semibold hover:underline truncate block">
          {user.full_name}
        </Link>
        {sub && <div className="text-xs text-textMuted">{sub}</div>}
      </div>
      <div className="flex gap-2">{actions}</div>
    </div>
  )
}

export default function FriendsPage() {
  const [tab, setTab] = useState('friends')
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['friends'] })
    qc.invalidateQueries({ queryKey: ['friend-req'] })
  }

  const friends = useQuery({ queryKey: ['friends'], queryFn: () => friendApi.list(null, 50), enabled: tab === 'friends' })
  const received = useQuery({ queryKey: ['friend-req', 'received'], queryFn: () => friendApi.received(null, 50), enabled: tab === 'received' })
  const sent = useQuery({ queryKey: ['friend-req', 'sent'], queryFn: () => friendApi.sent(null, 50), enabled: tab === 'sent' })

  const unfriend = useMutation({ mutationFn: (id: number) => friendApi.unfriend(id), onSuccess: invalidate })
  const accept = useMutation({ mutationFn: (id: number) => friendApi.accept(id), onSuccess: invalidate })
  const decline = useMutation({ mutationFn: (id: number) => friendApi.decline(id), onSuccess: invalidate })
  const block = useMutation({ mutationFn: (id: number) => blockApi.block(id), onSuccess: invalidate })

  const busy = unfriend.isPending || accept.isPending || decline.isPending || block.isPending

  return (
    <>
      <h1 className="text-xl font-bold">Bạn bè</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'friends' && (
        <>
          {friends.isPending && <CardSkeleton />}
          {friends.isError && <ErrorBox error={friends.error} onRetry={() => friends.refetch()} />}
          {friends.isSuccess && friends.data.items.length === 0 && <EmptyState>Chưa có bạn bè nào.</EmptyState>}
          {friends.data?.items.map((f: FriendItem) => (
            <PersonRow
              key={f.user_id}
              user={f}
              sub={`${f.mutual_friends_count} bạn chung · kết bạn ${timeAgo(f.friends_since)}`}
              actions={
                <>
                  <Link className="btn-ghost" to={`/messages/new?to=${f.user_id}`}>Nhắn tin</Link>
                  <button className="btn-ghost text-danger" disabled={busy} onClick={() => unfriend.mutate(f.user_id)}>
                    Huỷ kết bạn
                  </button>
                </>
              }
            />
          ))}
        </>
      )}

      {tab === 'received' && (
        <>
          {received.isPending && <CardSkeleton />}
          {received.isError && <ErrorBox error={received.error} onRetry={() => received.refetch()} />}
          {received.isSuccess && received.data.items.length === 0 && <EmptyState>Không có lời mời nào.</EmptyState>}
          {received.data?.items.map((r) => {
            const u = (r as any).requester ?? (r as any).user
            return (
              <PersonRow
                key={u.user_id}
                user={u}
                sub={`${r.mutual_friends_count} bạn chung · ${timeAgo(r.created_at)}`}
                actions={
                  <>
                    <button className="btn-primary" disabled={busy} onClick={() => accept.mutate(u.user_id)}>
                      Chấp nhận
                    </button>
                    <button className="btn-ghost" disabled={busy} onClick={() => decline.mutate(u.user_id)}>
                      Từ chối
                    </button>
                  </>
                }
              />
            )
          })}
        </>
      )}

      {tab === 'sent' && (
        <>
          {sent.isPending && <CardSkeleton />}
          {sent.isError && <ErrorBox error={sent.error} onRetry={() => sent.refetch()} />}
          {sent.isSuccess && sent.data.items.length === 0 && <EmptyState>Bạn chưa gửi lời mời nào.</EmptyState>}
          {sent.data?.items.map((r) => {
            const u = (r as any).receiver ?? (r as any).user
            return (
              <PersonRow
                key={u.user_id}
                user={u}
                sub={`${r.mutual_friends_count} bạn chung · ${timeAgo(r.created_at)}`}
                actions={
                  <button className="btn-ghost text-danger" disabled={busy} onClick={() => block.mutate(u.user_id)}>
                    Chặn
                  </button>
                }
              />
            )
          })}
        </>
      )}
    </>
  )
}
