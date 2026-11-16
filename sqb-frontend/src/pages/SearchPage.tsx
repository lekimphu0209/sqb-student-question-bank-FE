import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { searchApi } from '@/api/endpoints'
import type { SearchResultItem, SearchType } from '@/api/types'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, Tabs, timeAgo, Badge } from '@/components/ui'

const TABS: { key: SearchType; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'POST', label: 'Bài viết' },
  { key: 'USER', label: 'Người dùng' },
  { key: 'QUESTION', label: 'Câu hỏi' },
  { key: 'SESSION', label: 'Phiên' },
]

function ResultCard({ item }: { item: SearchResultItem }) {
  if (item.type === 'USER' && item.user) {
    const u = item.user
    return (
      <Link to={`/users/${u.user_id}`} className="card flex items-center gap-3 hover:bg-bg/50">
        <Avatar src={u.avatar_url} name={u.full_name} />
        <div className="min-w-0">
          <div className="font-semibold truncate">{u.full_name}</div>
          <div className="text-xs text-textMuted">
            {u.role} · {u.student_lecturer_code} {u.major && `· ${u.major}`}
          </div>
        </div>
      </Link>
    )
  }
  if (item.type === 'POST' && item.post) {
    const p = item.post
    return (
      <Link to={`/posts/${p.post_id}`} className="card block hover:bg-bg/50 space-y-1">
        <div className="flex items-center gap-2">
          <Avatar src={p.author_avatar_url} name={p.author_name} size={28} />
          <span className="text-sm font-semibold">{p.author_name}</span>
          <span className="text-xs text-textMuted">{timeAgo(p.created_at)}</span>
        </div>
        <p className="text-sm line-clamp-3">{p.content}</p>
        <div className="text-xs text-textMuted">👍 {p.react_count} · 💬 {p.comment_count}</div>
      </Link>
    )
  }
  if (item.type === 'QUESTION' && item.question) {
    const q = item.question
    return (
      <Link to={`/sessions/${q.subject_id}/practice`} className="card block hover:bg-bg/50 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <Badge tone={q.status === 'APPROVED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'muted'}>{q.status}</Badge>
          <span className="text-textMuted">{q.subject_name} · {q.difficulty}</span>
        </div>
        <p className="text-sm line-clamp-3">{q.content}</p>
        <div className="text-xs text-textMuted">⭐ {q.avg_rating?.toFixed(1)} ({q.rating_count}) · 👍 {q.react_count}</div>
      </Link>
    )
  }
  if (item.type === 'SESSION' && item.session) {
    const s = item.session
    return (
      <Link to={`/sessions/${s.session_id}/practice`} className="card block hover:bg-bg/50 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <Badge>{s.status}</Badge>
          <span className="text-textMuted">{s.subject_name}</span>
        </div>
        <p className="font-semibold text-sm">{s.title}</p>
        <div className="text-xs text-textMuted">{s.question_count} câu · 👍 {s.react_count}</div>
      </Link>
    )
  }
  if (item.type === 'SUBJECT' && item.subject) {
    return (
      <div className="card text-sm">
        <b>{item.subject.code}</b> — {item.subject.name}
      </div>
    )
  }
  return null
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('query') ?? ''
  const type = (params.get('type') as SearchType) || 'ALL'
  const [input, setInput] = useState(query)
  const qc = useQueryClient()

  const saved = useQuery({ queryKey: ['search-saved'], queryFn: searchApi.saved })

  const results = useInfiniteQuery({
    queryKey: ['search', query, type],
    queryFn: ({ pageParam }) => searchApi.run(query, type, pageParam, 10),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
    enabled: !!query,
  })

  const removeSaved = useMutation({
    mutationFn: (id: number) => searchApi.removeSaved(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search-saved'] }),
  })

  function doSearch(q: string, t: SearchType = type) {
    const v = q.trim()
    if (!v) return
    setParams({ query: v, type: t })
  }

  const items = results.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <h1 className="text-xl font-bold">Tìm kiếm</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          doSearch(input)
        }}
        className="card flex gap-2"
      >
        <input className="input" placeholder="Nhập từ khoá..." value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn-primary" type="submit">Tìm</button>
      </form>

      {!query && (
        <div className="card space-y-3">
          {saved.isPending && <CardSkeleton />}
          {saved.isSuccess && (
            <>
              {saved.data.saved_searches.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Tìm kiếm gần đây</h3>
                  <div className="flex flex-wrap gap-2">
                    {saved.data.saved_searches.map((s) => (
                      <span key={s.saved_search_id} className="inline-flex items-center gap-1 bg-bg rounded-full px-3 py-1 text-sm">
                        <button className="hover:text-primary" onClick={() => { setInput(s.query_text); doSearch(s.query_text) }}>
                          {s.query_text}
                        </button>
                        <button className="text-textMuted hover:text-danger" onClick={() => removeSaved.mutate(s.saved_search_id)}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {saved.data.trending_searches.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Xu hướng</h3>
                  <div className="flex flex-wrap gap-2">
                    {saved.data.trending_searches.map((t) => (
                      <button key={t} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm" onClick={() => { setInput(t); doSearch(t) }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {saved.data.saved_searches.length === 0 && saved.data.trending_searches.length === 0 && (
                <p className="text-sm text-textMuted">Nhập từ khoá để bắt đầu tìm kiếm.</p>
              )}
            </>
          )}
        </div>
      )}

      {query && (
        <>
          <Tabs tabs={TABS} active={type} onChange={(t) => doSearch(query, t as SearchType)} />
          {results.isPending && <CardSkeleton />}
          {results.isError && <ErrorBox error={results.error} onRetry={() => results.refetch()} />}
          {results.isSuccess && items.length === 0 && <EmptyState>Không tìm thấy kết quả cho “{query}”.</EmptyState>}
          {results.isSuccess && (
            <p className="text-xs text-textMuted">{results.data.pages[0]?.total_hits ?? items.length} kết quả</p>
          )}
          {items.map((it, i) => (
            <ResultCard key={`${it.type}-${i}`} item={it} />
          ))}
          {results.hasNextPage && (
            <button className="btn-ghost w-full" onClick={() => results.fetchNextPage()} disabled={results.isFetchingNextPage}>
              {results.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
            </button>
          )}
        </>
      )}
    </>
  )
}
