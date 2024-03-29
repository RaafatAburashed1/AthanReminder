import { PUBLIC_GOOGLE_API_KEY } from "$env/static/public";

const config = {
    googleApi: (lat: number, lng: number) => ({
        url: `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${PUBLIC_GOOGLE_API_KEY}`
    }),
    prayerApi: (city: string, country: string, year: string, month: string) => ({
        url: `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=${country}`
    })
}

export default config;