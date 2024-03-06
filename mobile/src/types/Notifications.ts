export type NotificationType = 'Ring' | 'Vibrate' | 'Silent' | 'None';

export type Notifications = {
    fajr: NotificationType;
    sunrise: NotificationType;
    dhuhr: NotificationType;
    asr: NotificationType;
    maghrib: NotificationType;
    isha: NotificationType;
}


export type PrayerTimeAndNotification = {
    time: string;
    notification: NotificationType;
}