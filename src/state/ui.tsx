import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { ProductSheet } from '../components/ProductSheet';
import { TrialDetail } from '../screens/TrialDetail';
import { FriendProfile } from '../components/FriendProfile';
import { PostDetail } from '../components/PostDetail';
import { FeaturedListView } from '../components/FeaturedListView';
import { ShadeMatchView } from '../components/ShadeMatchView';
import { WrappedCard } from '../screens/WrappedCard';
import type { ActivityPost } from '../lib/activity';

// Lightweight UI-navigation context so any screen can open the Product (Skin Match) sheet, a
// Trial, a friend's profile, a Post (score + comments), a Featured List, or Skin Wrapped —
// without prop-drilling. All render into #stack-overlay; a Post renders on top of a friend
// profile, and the Product sheet renders on top of a Featured List, so you can return.
interface UIValue {
  openProduct(productId: string): void;
  openTrial(trialId: string): void;
  openPost(post: ActivityPost): void;
  openFriend(personId: string): void;
  openList(listId: string): void;
  openShade(): void;
  openWrapped(): void;
}

const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [productId, setProductId] = useState<string | null>(null);
  const [trialId, setTrialId] = useState<string | null>(null);
  const [friendId, setFriendId] = useState<string | null>(null);
  const [post, setPost] = useState<ActivityPost | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [shadeOpen, setShadeOpen] = useState(false);
  const [wrapped, setWrapped] = useState(false);

  const openProduct = useCallback((id: string) => {
    // keep any open Featured List behind the product sheet so it returns on close
    setTrialId(null);
    setPost(null);
    setFriendId(null);
    setProductId(id);
  }, []);
  const openTrial = useCallback((id: string) => {
    setProductId(null);
    setPost(null);
    setFriendId(null);
    setListId(null);
    setTrialId(id);
  }, []);
  const openFriend = useCallback((id: string) => {
    setProductId(null);
    setTrialId(null);
    setPost(null);
    setListId(null);
    setFriendId(id);
  }, []);
  const openPost = useCallback((p: ActivityPost) => {
    // keep any open friend profile behind the post
    setProductId(null);
    setTrialId(null);
    setListId(null);
    setPost(p);
  }, []);
  const openList = useCallback((id: string) => {
    setProductId(null);
    setTrialId(null);
    setPost(null);
    setFriendId(null);
    setShadeOpen(false);
    setListId(id);
  }, []);
  // Shade Match sits behind the Product sheet (opened from it) and behind a friend profile
  // (a "person with your skin"), so openProduct/openFriend intentionally leave it mounted.
  const openShade = useCallback(() => {
    setProductId(null);
    setTrialId(null);
    setPost(null);
    setFriendId(null);
    setListId(null);
    setShadeOpen(true);
  }, []);
  const openWrapped = useCallback(() => setWrapped(true), []);

  return (
    <UIContext.Provider
      value={{ openProduct, openTrial, openPost, openFriend, openList, openShade, openWrapped }}
    >
      {children}
      <FeaturedListView listId={listId} onClose={() => setListId(null)} onOpenProduct={openProduct} />
      <ShadeMatchView
        open={shadeOpen}
        onClose={() => setShadeOpen(false)}
        onOpenProduct={openProduct}
        onOpenFriend={openFriend}
      />
      <ProductSheet productId={productId} onClose={() => setProductId(null)} onOpenTrial={openTrial} />
      <TrialDetail trialId={trialId} onClose={() => setTrialId(null)} />
      <FriendProfile personId={friendId} onClose={() => setFriendId(null)} onOpenPost={openPost} />
      <PostDetail post={post} onClose={() => setPost(null)} onOpenFriend={openFriend} />
      <WrappedCard open={wrapped} onClose={() => setWrapped(false)} />
    </UIContext.Provider>
  );
}

export function useUI(): UIValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within <UIProvider>');
  return ctx;
}
