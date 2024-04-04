/* eslint-disable @typescript-eslint/no-explicit-any */
// import { testApi } from '$lib/testData';
// import { test } from '$lib/testGoogleData';

import moment from 'moment';
import type { DailyPrayer } from '../../types/DailyPrayer';
import supabase from '$lib/supabase/supabase';
import { Geolocation } from '@capacitor/geolocation';
import config from '../../config';
import type { Location } from '../../types/location';

let location: string | null;
let currentCity: string, currentCountry: string;
// const currentDate: string = moment().format('DD-MM-YYYY');
let currentDate: string;
const currentMonth = moment().format('MM');
const nextMonth = moment().add(1, 'M').format('MM');
const currentYear = moment().format('YYYY');

/*
TODO
[X] test when prayer time and location in cache
[X] test when only prayer time in cache -> should refetch from db
[X] test when only location in cache -> should refetch from db
[X] test when in db and not cache
[X] test when in db and is expired
[X] test when not in db and need to get from api
*/
export const getPrayerTimes = async (cd: string): Promise<DailyPrayer | undefined> => {
	try {
		currentDate = cd;
		// check cache for prayer times and location
		const cachedData = await checkCacheForData();
		if (cachedData) return cachedData;

		// currentDate = moment().format('DD-MM-YYYY');

		// if location isnt cached retrieve it
		if (location === null) {
			location = await getCurrentLocationFromApi();
			if (location === null) return undefined;
		}

		// set city, state and country from location
		setCityStateCountry();

		// Fetch prayer times from database
		const dailyPrayerFromDB: DailyPrayer | undefined = await getPrayerTimesFromDB();
		if (dailyPrayerFromDB) return dailyPrayerFromDB;

		// Fetch prayer times from api
		const prayerTimesFromApi = await getPrayerTimesFromApi();
		// Save prayer times in db
		await storePrayerTimesInDB(prayerTimesFromApi);

		// return todays prayer time
		return prayerTimesFromApi.get(currentDate);
	} catch (error) {
		console.log(JSON.stringify(error), 'error getting prayer times');
		return undefined;
	}
};
//check if we need to refetch the current months prayer times as the month has changed
const checkForRefetch = (prayerMapping: Map<string, DailyPrayer>): boolean => {
	const firstElement = prayerMapping.keys().next().value;
	const array = firstElement.split('-')
	if (array[1] === currentMonth) return true;

	return false
}

const checkCacheForData = async (): Promise<DailyPrayer | undefined> => {
	// check cache for prayer times if not there continue
	const prayerStored = localStorage.getItem('prayerTimes');
	location = localStorage.getItem('location');
	if (prayerStored !== null && location !== null) {
		setCityStateCountry();
		//parse and return todays prayer times from cache
		const prayerStoredParsed = JSON.parse(prayerStored);
		const prayerMapping = new Map<string, DailyPrayer>(prayerStoredParsed);
		const todaysPrayers = prayerMapping.get(currentDate);

		if (todaysPrayers && checkForRefetch(prayerMapping)) return todaysPrayers;
	}
	return undefined;
};

const getPrayerTimesFromDB = async (): Promise<DailyPrayer | undefined> => {
	if (location !== null) {
		const { data } = await supabase.from('prayer_timings').select().eq('location', location.replace(/\s/g, ''));
		//if data is found and not expired return todays prayer times
		if (data && data.length > 0) {
			const expiresAt = moment(data[0].expires_at, 'DD-MM-YYYY');
			const cd = moment(currentDate, 'DD-MM-YYYY');
			if (cd <= expiresAt) {
				const prayerMapping = new Map<string, DailyPrayer>(Object.entries(data[0].timings));
				localStorage.setItem('prayerTimes', JSON.stringify(Array.from(prayerMapping.entries())));

				return prayerMapping.get(currentDate);
			}
		}
	}
	return undefined;
};
const storePrayerTimesInDB = async (prayerMapping: Map<string, DailyPrayer>) => {
	// store prayer times in db
	if (location !== null) {
		const { data } = await supabase.from('prayer_timings').upsert([
			{
				location: location.replace(/\s/g, ''),
				timings: Object.fromEntries(prayerMapping),
				expires_at: moment().endOf('month').format('DD-MM-YYYY')
			}
		]);
		return data;
	}
};

const getPrayerTimesFromApi = async (): Promise<Map<string, DailyPrayer>> => {
	const nextMonthYear = nextMonth === '01' ? moment(currentYear).add(1, 'year').format('YYYY') : currentYear;
	const urls = [
		`${config.prayerApi(currentCity, currentCountry, currentYear, currentMonth).url}`,
		`${config.prayerApi(currentCity, currentCountry, nextMonthYear, nextMonth).url}`
	];

	const requests = urls.map(url => fetch(url).then(response => response.json()));

	const [data, data2] = await Promise.all(requests);

	// const data = testApi;
	//clean up the data, save it to cache and database
	const prayerMapping: Map<string, DailyPrayer> = new Map();
	//convert to 12 hour format and save to map
	data.data.forEach((dayOfMonth: any) => {
		const timings = {
			hijriMonth: dayOfMonth.date.hijri.month.en,
			hijriDate: dayOfMonth.date.hijri.date,
			fajr: convertTo12Hour(dayOfMonth.timings.Fajr),
			sunrise: convertTo12Hour(dayOfMonth.timings.Sunrise),
			dhuhr: convertTo12Hour(dayOfMonth.timings.Dhuhr),
			asr: convertTo12Hour(dayOfMonth.timings.Asr),
			maghrib: convertTo12Hour(dayOfMonth.timings.Maghrib),
			isha: convertTo12Hour(dayOfMonth.timings.Isha)
		};
		prayerMapping.set(dayOfMonth.date.gregorian.date, timings);
	});
	data2.data.slice(0, 7).forEach((dayOfMonth: any) => {
		const timings = {
			hijriMonth: dayOfMonth.date.hijri.month.en,
			hijriDate: dayOfMonth.date.hijri.date,
			fajr: convertTo12Hour(dayOfMonth.timings.Fajr),
			sunrise: convertTo12Hour(dayOfMonth.timings.Sunrise),
			dhuhr: convertTo12Hour(dayOfMonth.timings.Dhuhr),
			asr: convertTo12Hour(dayOfMonth.timings.Asr),
			maghrib: convertTo12Hour(dayOfMonth.timings.Maghrib),
			isha: convertTo12Hour(dayOfMonth.timings.Isha)
		};
		prayerMapping.set(dayOfMonth.date.gregorian.date, timings);
	});
	localStorage.setItem('prayerTimes', JSON.stringify(Array.from(prayerMapping.entries())));

	return prayerMapping;
};

const getCurrentLocationFromApi = async (): Promise<any> => {
	try {
		const cachedLocaction = localStorage.getItem('location');
		if (cachedLocaction !== null) return cachedLocaction;
		const permissions = await Geolocation.requestPermissions();
		if (permissions.location !== 'granted') return null;
		const coordinates = await Geolocation.getCurrentPosition();
		const response = await fetch(
			`${config.googleApi(coordinates.coords.latitude, coordinates.coords.longitude).url}`
		);
		const data = await response.json();
		if (data.status !== 'OK') throw new Error('Error fetching location');

		const getLocation = extractLocationInfo(data);
		// const getLocation = extractLocationInfo(test);

		//combine to unique string and store it in local storage
		const combinedLocation = `${getLocation.city}-${getLocation.state}-${getLocation.country}`
			.toLowerCase()
			.split(' ')
			.join('');

		localStorage.setItem('location', combinedLocation);

		return combinedLocation;
	} catch (err) {
		console.log(JSON.stringify(err), " ERROR From currentlocation ")
	}

};

const extractLocationInfo = (loc: any): Location => {
	let city, country, state;

	for (const result of loc.results) {
		for (const component of result.address_components) {
			if (component.types.includes('locality')) {
				city = component.long_name;
			} else if (component.types.includes('administrative_area_level_1')) {
				state = component.long_name;
			} else if (component.types.includes('country')) {
				country = component.long_name;
			}

			// Break out of the inner loop if all required information is found
			if (city && country && state) {
				break;
			}
		}

		// Break out of the outer loop if all required information is found
		if (city && country && state) {
			break;
		}
	}

	return { city: city!, state: state!, country: country! };
};

const setCityStateCountry = () => {
	const locationArray = location!.split('-');
	currentCity = locationArray[0].replace(/\s/g, '');
	currentCountry = locationArray[2].replace(/\s/g, '');
};

// Function to convert time to  12-hour format
const convertTo12Hour = (time: string) => {
	const [timePart] = time.split(' ');
	// Convert the time to a Moment.js object
	const momentTime = moment(timePart, 'HH:mm');
	// Format the time in  12-hour format
	const formattedTime = momentTime.format('hh:mm A');
	// Return the formatted time with the period
	return formattedTime;
};

