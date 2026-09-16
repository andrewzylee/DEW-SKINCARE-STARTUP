// Sample routine + trials for the Shelf (production comes from Supabase routine_items / trials).
export const routineAM: string[] = ['cerave-foaming-cleanser', 'ordinary-niacinamide', 'boj-relief-sun'];
export const routinePM: string[] = ['cerave-hydrating-cleanser', 'differin-adapalene', 'cerave-daily-lotion'];

export interface SampleTrial {
  id: string;
  productId: string;
  day: number;
  checkins: number;
}
export const sampleTrials: SampleTrial[] = [
  { id: 't1', productId: 'krave-barrier', day: 12, checkins: 2 },
];
