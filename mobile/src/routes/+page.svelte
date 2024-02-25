<script lang="ts">
	import { onMount } from 'svelte';
	import { Geolocation } from '@capacitor/geolocation';
	import { PUBLIC_GOOGLE_API_KEY } from '$env/static/public';
	import config from '../config';
	import supabase from '$lib/supabase/supabase';

	const getPrayerTimes = async (): Promise<string> => {
		// check cache for prayer times if not there continue
		const prayerTimes = localStorage.getItem('prayerTimes');
		if (prayerTimes !== null) return prayerTimes;

		// check if we have location in cache, if not get it
		let location = await getCurrentPosition();
		console.log(location, 'location');

		// // fetch from database with location if not found
		// const prayerTimesFromDB = await getPrayerTimesFromDB(location);
		// if (prayerTimesFromDB && prayerTimesFromDB.length > 0) return prayerTimesFromDB.toString();

		// fetch from api, clean the data and save it to cache and database
		//const prayerTimesFromApi = await getPrayerTimesFromApi();
		return 'prayer times broza';
	};

	const getPrayerTimesFromDB = async (location: string) => {
		const { data, error } = await supabase.from('prayer_times').select().eq('location', location);
		console.log(data, 'data');
		return data;
	};

	const getPrayerTimesFromApi = async (location: string): Promise<string> => {
		const response = await fetch(`${config.prayerApi.url}?location=${location}`);
		const json = await response.json();
		//clean up the data, save it to cache and database
		console.log(json, 'json');
		return json;
	};

	const getCurrentPosition = async (): Promise<string> => {
		let location = localStorage.getItem('location');
		if (location !== null) return location;
		const coordinates = await Geolocation.getCurrentPosition();
		console.log('Current position:', coordinates);
		console.log('api:', config.googleApi.url);
		location = 'location from google api';
		return location;
	};

	onMount(async () => {
		// const response = await fetch('/api/athan');
		// const json = await response.json();
		// console.log(json, 'json');
		const prayerTimes = await getPrayerTimes();
		console.log(prayerTimes, 'prayerTimes');
	});
</script>

<main>
	<div class="text-green-400">Hello</div>
</main>
