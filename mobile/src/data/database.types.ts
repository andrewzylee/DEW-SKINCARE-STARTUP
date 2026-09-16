// Row shapes for the Supabase tables the app reads/writes (mirrors supabase/migrations). Repo
// functions cast query results to these, keeping the data boundary typed without the full
// generated Database generic. Regenerate with `supabase gen types typescript` later if desired.
export interface ProductRow {
  id: string;
  brand: string;
  name: string;
  category: string;
  domain: string;
  price: number | null;
  image_url: string | null;
  blurb: string | null;
  style_tags: string[];
  is_custom: boolean;
  created_by: string | null;
  status: string;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  location: string;
  avatar_url: string | null;
  school: string | null;
  member_since: string;
  onboarded: boolean;
}

export interface RankingRow {
  id: string;
  user_id: string;
  product_id: string;
  position: number;
  reaction: string | null;
  strength: string | null;
  note: string | null;
}

export interface FollowRow {
  follower_id: string;
  followee_id: string;
}

export interface PostRow {
  id: string;
  user_id: string;
  type: string;
  product_id: string | null;
  tier: string | null;
  note: string | null;
  standout: string | null;
  created_at: string;
}

export interface RankEventRow {
  id: string;
  user_id: string;
  product_id: string;
  category: string;
  from_rank: number | null;
  to_rank: number;
  group_size: number;
  reason: string | null;
  created_at: string;
}
