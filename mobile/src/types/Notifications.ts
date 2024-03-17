export type NotificationType = 'Ring' | 'Vibrate' | 'Silent' | 'None';
// type prayers = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type Notifications = {
    [key in string]: NotificationType;
}


export type PrayerTimeAndNotification = {
    time: string;
    notification: NotificationType;
}