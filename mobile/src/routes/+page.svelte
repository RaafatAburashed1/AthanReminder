<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import moment, { type Moment } from 'moment';
	import type { DailyPrayer } from '../types/DailyPrayer';
	import '../assets/AboveClouds.png';
	import { getPrayerTimes } from './components/getPrayerTimes';
	import { TodaysPrayer } from '../types/DailyPrayer';
	import { Capacitor } from '@capacitor/core';
	import type { NotificationType, Notifications } from '../types/Notifications';

	let prayerTimes: DailyPrayer | undefined;
	let currentCity: string, currentState: string, currentCountry: string;
	let loading: boolean = true;
	let errorState: boolean = false;
	let currentDate: string = moment().format('dddd, MMMM Do YYYY');
	let nextPrayer: string, nextPrayerTime: string;
	let cleanHijriDateString: string;
	let intervalId: any;
	let timeRemaining: string;
	let todayFinished: boolean = false;

	let notificationSettings: Notifications;

	const setCityStateCountry = (location: string) => {
		const locationArray = location!.split('-');
		currentCity = locationArray[0];
		currentState = locationArray[1];
		currentCountry = locationArray[2];
	};

	const capitalizeFirstLetter = (str: string): string => {
		if (str === undefined) return '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	};
	//format the hijri date
	const cleanHijriDate = (str: string | undefined) => {
		const dArray = str!.split('-');
		cleanHijriDateString = `${dArray[0]}, ${dArray[2]}`;
	};
	//find which prayer is next
	const findNextPrayer = async () => {
		console.log('we are here');
		const currentTime = moment();
		for (const [prayer, timeString] of Object.entries(prayerTimes!)) {
			if (prayer === 'hijriDate' || prayer === 'hijriMonth') continue;
			const prayerTime = moment(timeString, 'hh:mm A');
			if (currentTime.isBefore(prayerTime)) {
				nextPrayer = prayer;
				nextPrayerTime = timeString;
				todayFinished = false;
				break;
			}
		}
		if (nextPrayer === undefined) {
			console.log('we are here 2');
			todayFinished = true;
			const nextDayPrayer = await getPrayerTimes(moment().add(1, 'days').format('DD-MM-YYYY'));
			nextPrayer = 'Fajr';
			nextPrayerTime = nextDayPrayer?.fajr!;
			updateTimeRemaining();
		}
	};
	//update time remaining until next prayer
	const updateTimeRemaining = () => {
		const now = moment();
		let nextPrayerMoment = moment(nextPrayerTime, 'hh:mm A');
		if (todayFinished) {
			nextPrayerMoment = nextPrayerMoment.add(24, 'hours');
		}
		const diff = nextPrayerMoment.diff(now);
		if (diff <= 0) {
			clearInterval(intervalId);
			findNextPrayer();
			updateTimeRemaining();
		} else {
			const hours = Math.floor(moment.duration(diff).asHours());
			const minutes = moment.duration(diff).minutes();

			timeRemaining = `${hours}h ${minutes + 1}m`;
		}
	};

	const prepareData = () => {
		if (prayerTimes === undefined) {
			errorState = true;
			localStorage.clear();
			//get them to manually set location
			//TODO need to update the button to go to settings
			//open a modal to handle manual location setting
			// goto('/settings');
		} else {
			const location = localStorage.getItem('location');
			setCityStateCountry(location!);
			findNextPrayer();
			cleanHijriDate(prayerTimes?.hijriDate);
			//update time remaining unti next prayer every 3 seconds
			updateTimeRemaining();
			intervalId = setInterval(updateTimeRemaining, 3000);
		}
	};

	const handleNotificationsButtonClick = (prayer: string) => (event: MouseEvent) => {
		const currentNotificationType: NotificationType =
			notificationSettings[prayer as keyof Notifications];
		console.log(currentNotificationType, 'currentNotificationType');
		let newNotificationType;
		switch (currentNotificationType) {
			case 'Ring':
				newNotificationType = 'Vibrate';
				break;
			case 'Vibrate':
				newNotificationType = 'Silent';
				break;
			case 'Silent':
				newNotificationType = 'None';
				break;
			case 'None':
				newNotificationType = 'Ring';
				break;
			default:
				console.error(`Unknown notification type: ${currentNotificationType}`);
				return;
		}
		notificationSettings[prayer as keyof Notifications] = newNotificationType as NotificationType;
		console.log(notificationSettings, 'notificationSettings');
		localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
	};

	const getNotificationSetting = (prayer: string) => {
		return notificationSettings[prayer as keyof Notifications];
	};

	onDestroy(() => {
		clearInterval(intervalId);
	});

	onMount(async () => {
		loading = true;
		prayerTimes = await getPrayerTimes(moment().format('DD-MM-YYYY'));
		prepareData();
		const getNoti: string | null = localStorage.getItem('notificationSettings');
		if (getNoti === null) {
			notificationSettings = {
				fajr: 'Ring',
				sunrise: 'Ring',
				dhuhr: 'Ring',
				asr: 'Ring',
				maghrib: 'Ring',
				isha: 'Ring'
			};
			localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
		} else {
			notificationSettings = JSON.parse(getNoti);
		}
		console.log(notificationSettings, 'notificationSettings');
		loading = false;
	});
</script>

<main
	class="flex flex-col overflow-auto"
	style="height: {Capacitor.getPlatform() === 'ios'
		? 'calc(100vh - (64px + env(safe-area-inset-bottom)))'
		: 'calc(100vh - (64px + 20px))'}"
>
	<div class="flex-grow w-full bg-[url('src/assets/AboveClouds.png')] bg-cover pb-10">
		<!-- <div class="w-full flex-grow bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"> -->
		{#if loading}
			<div>Loading...</div>
		{:else if errorState}
			<div>Error...</div>
		{:else}
			<div class="text-red-400">
				{capitalizeFirstLetter(currentCity)}
				{capitalizeFirstLetter(currentCountry)}
			</div>
			<div class="text-red-400">{currentDate}</div>
			<div class="text-red-400">
				{prayerTimes?.hijriMonth}
				{cleanHijriDateString}
			</div>

			<div class=" w-full glass h-32 mb-10">
				<article class=" flex flex-row ml-2 pt-2 items-center">
					<h1 class="mr-10 text-white font-extrabold text-5xl">
						{capitalizeFirstLetter(nextPrayer)}
					</h1>
					<h1 class="text-white text-4xl font-semibold mt-2">
						{nextPrayerTime}
					</h1>
				</article>
				<article class=" flex flex-row ml-2 pt-2">
					<h2 class="mr-4 text-white">Time:</h2>
					<h2 class="text-white font-mono">
						{timeRemaining}
					</h2>
				</article>
			</div>
			<div class="flex w-full justify-center align-middle">
				<article class="w-11/12 text-center glass text-white pl-2">
					{#if prayerTimes}
						{#each Object.entries(prayerTimes) as [prayer, time]}
							{#if prayer !== 'hijriDate' && prayer !== 'hijriMonth'}
								<div class="flex justify-between items-center mb-5 mt-5">
									<h4 class="">{capitalizeFirstLetter(prayer)}:</h4>
									<h4 class="flex items-center mr-2 font-mono">
										<div>{time}</div>
										<button class=" btn-xs ml-2" on:click={handleNotificationsButtonClick(prayer)}>
											<!-- <img class="w-5 h-5" src="src/assets/volume.png" alt="Volume" /> -->
											{#if getNotificationSetting(prayer) === 'Ring'}
												<img class="w-5 h-5" src="src/assets/volume.png" alt="Volume" />
											{:else if getNotificationSetting(prayer) === 'Vibrate'}
												<img class="w-5 h-5" src="src/assets/vibrate.png" alt="Vibrate" />
											{:else if getNotificationSetting(prayer) === 'Silent'}
												<img class="w-5 h-5" src="src/assets/mute.png" alt="Silent" />
											{:else}
												X
											{/if}
										</button>
									</h4>
								</div>
							{/if}
						{/each}
					{/if}
				</article>
			</div>
		{/if}
	</div>
</main>
