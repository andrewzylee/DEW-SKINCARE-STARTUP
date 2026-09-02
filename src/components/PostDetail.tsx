import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react';
import { getProduct } from '../data/mockCatalog';
import { getPerson } from '../data/social';
import { useStore } from '../state/store';
import type { ActivityPost } from '../lib/activity';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { Avatar } from './Avatar';
import { ProductImage } from './ProductImage';
import { CategoryTag } from './CategoryTag';

function useAuthor() {
  const { state } = useStore();
  return (personId: string) => {
    if (personId === 'me')
      return { name: state.account.displayName, tint: '12 143 98', avatar: state.account.avatar };
    const p = getPerson(personId);
    return p
      ? { name: p.name, tint: p.tint, avatar: undefined as string | undefined }
      : { name: 'Someone', tint: '138 143 153', avatar: undefined };
  };
}

export function PostDetail({
  post,
  onClose,
  onOpenFriend,
}: {
  post: ActivityPost | null;
  onClose: () => void;
  onOpenFriend: (personId: string) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, addComment, toggleLikePost } = useStore();
  const resolve = useAuthor();
  const [draft, setDraft] = useState('');

  if (!root) return null;

  const product = post?.productId ? getProduct(post.productId) : undefined;
  const comments = post ? [...post.seed, ...(state.postComments[post.id] ?? [])] : [];
  const liked = post ? state.likedPosts.includes(post.id) : false;
  const likeCount = post ? post.likes + (liked ? 1 : 0) : 0;

  const send = () => {
    if (!post || !draft.trim()) return;
    addComment(post.id, draft);
    setDraft('');
  };

  return createPortal(
    <AnimatePresence>
      {post && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[60] flex flex-col bg-bg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={spring}
        >
          <div className="flex items-center gap-3 px-5 pb-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[18px] font-bold tracking-tight">Post</h1>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
            {/* Post */}
            <div className="rounded-card bg-surface p-4 shadow-card">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={post.personId === 'me'}
                  onClick={() => onOpenFriend(post.personId)}
                  className="shrink-0"
                >
                  <Avatar name={post.person.name} src={post.person.avatar} tint={post.person.tint} size="md" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-tight">
                    <span className="font-semibold">{post.person.name.split(' ')[0]}</span>{' '}
                    {post.action}
                    {product ? (
                      <>
                        {' '}
                        <span className="font-semibold">{product.name}</span>
                      </>
                    ) : (
                      ''
                    )}
                  </p>
                  <p className="num text-[12px] text-muted">{post.timeAgo}</p>
                </div>
                {post.badge && (
                  <span
                    className="num inline-flex items-center rounded-full border-2 px-2.5 py-1 text-[14px] font-bold"
                    style={{ borderColor: post.badge.color, color: post.badge.color }}
                  >
                    {post.badge.text}
                  </span>
                )}
              </div>

              {product && (
                <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-bg p-2.5">
                  <ProductImage id={product.id} brand={product.brand} name={product.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <CategoryTag category={product.category} />
                    <div className="truncate text-[14px] font-semibold leading-tight">{product.name}</div>
                    <div className="truncate text-[12px] text-muted">{product.brand}</div>
                  </div>
                  <span className="num text-[13px] font-semibold">${product.price}</span>
                </div>
              )}

              {post.review && <p className="mt-3 text-[15px] leading-snug">{post.review}</p>}

              <div className="mt-3 flex items-center gap-5 border-t border-line pt-3 text-ink">
                <button
                  type="button"
                  onClick={() => toggleLikePost(post.id)}
                  className="flex items-center gap-1.5 text-[13px]"
                >
                  <Heart
                    size={19}
                    className={cn(liked ? 'text-tier-f' : 'text-ink')}
                    fill={liked ? 'currentColor' : 'none'}
                  />
                  <span className="num text-muted">{likeCount}</span>
                </button>
                <span className="flex items-center gap-1.5 text-[13px]">
                  <MessageCircle size={19} />
                  <span className="num text-muted">{comments.length}</span>
                </span>
              </div>
            </div>

            {/* Comments */}
            <h2 className="mb-1 mt-5 px-1 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
              Comments
            </h2>
            {comments.length === 0 ? (
              <p className="px-1 py-4 text-[13.5px] text-muted">No comments yet. Be the first.</p>
            ) : (
              <div className="flex flex-col">
                {comments.map((c) => {
                  const a = resolve(c.personId);
                  return (
                    <div key={c.id} className="flex items-start gap-3 border-t border-line py-3 first:border-t-0">
                      <button
                        type="button"
                        disabled={c.personId === 'me'}
                        onClick={() => onOpenFriend(c.personId)}
                        className="shrink-0"
                      >
                        <Avatar name={a.name} src={a.avatar} tint={a.tint} size="sm" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] leading-snug">
                          <span className="font-semibold">{a.name.split(' ')[0]}</span>{' '}
                          <span className="num text-[11px] text-muted">{c.timeAgo}</span>
                        </p>
                        <p className="text-[14px] leading-snug text-ink">{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add a comment */}
          <div className="safe-b border-t border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <Avatar name={state.account.displayName} src={state.account.avatar} size="sm" />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Add a comment…"
                maxLength={200}
                className="flex-1 rounded-full bg-ink/[0.05] px-4 py-2.5 text-[15px] outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white disabled:opacity-40"
                aria-label="Send comment"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}
