import type { PrayerTimeAndNotification } from "./Notifications";

export type DailyPrayer = {
    hijriMonth: string;
    hijriDate: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

export type DailyPrayerData = {
    dailyPrayer: DailyPrayer | undefined;
    location: string | null;
    currentDate: string;
    currentCity: string;
    currentState: string;
    currentCountry: string;
};


export type TodaysPrayer = {
    hijriMonth: string;
    hijriDate: string;
    fajr: PrayerTimeAndNotification;
    sunrise: PrayerTimeAndNotification;
    dhuhr: PrayerTimeAndNotification;
    asr: PrayerTimeAndNotification;
    maghrib: PrayerTimeAndNotification;
    isha: PrayerTimeAndNotification;
}