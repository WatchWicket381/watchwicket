import { MatchFormat } from "./matchTypes";

// Preset configuration for each match format
export const formatPresets: Record<
  MatchFormat,
  {
    oversLimit: number | null;   // null = unlimited (Test Match)
    inningsCount: number;        // 2 = Indoor/T20/ODI, 4 = Test
  }
> = {
  INDOOR: {
    oversLimit: 18,      // You can change this anytime in UI
    inningsCount: 2,     // Indoor has 2 innings
  },

  T20: {
    oversLimit: 20,
    inningsCount: 2,
  },

  ODI: {
    oversLimit: 50,
    inningsCount: 2,
  },

  TEST: {
    oversLimit: null,    // Unlimited overs – manual End Innings
    inningsCount: 4,
  },
};
