// The single gate between the bundled sample cast and what a real user sees.
//
// core/social.ts is demo content: six invented people with names, bios and cities, their shelves,
// a feed and a set of rank moves. That is fine in Demo Mode, which is explicitly labelled. It is
// NOT fine once someone signs in to a real backend — presenting invented accounts as their
// community is dishonest and an App Store 2.1 problem.
//
// None of the social tables (posts, follows, comments, post_likes, rank_events) have client code
// yet, so real mode has nothing true to show. It shows nothing, and the screens render empty
// states. When those tables get wired, this module is where the real queries land.
import { isSupabaseConfigured } from '@/data/config';
import type { FeedActivity, Person, RankMove } from './types';
import * as sample from './social';

/** True when the bundled demo cast is the legitimate data source. */
export const usingDemoGraph = !isSupabaseConfigured;

export const people: Person[] = usingDemoGraph ? sample.people : [];
export const feed: FeedActivity[] = usingDemoGraph ? sample.feed : [];
export const rankMoves: RankMove[] = usingDemoGraph ? sample.rankMoves : [];
export const friendShelves: Record<string, string[]> = usingDemoGraph ? sample.friendShelves : {};

/**
 * The starter shelf used to seed Demo Mode and to compute "your taste" against the sample cast.
 * In real mode the shelf comes from the rankings table via useMyShelf, so this is empty.
 */
export const myShelf: string[] = usingDemoGraph ? sample.myShelf : [];

export const getPerson = (id: string): Person | undefined =>
  usingDemoGraph ? sample.getPerson(id) : undefined;
