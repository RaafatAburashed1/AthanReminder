import type { DailyPrayer } from "./DailyPrayer";

export type PrayerTimings = {
    id: number;
    created_at: string;
    expires_at: string;
    location: string;
    timings: Map<string, DailyPrayer>;
}