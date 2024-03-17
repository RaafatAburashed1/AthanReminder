<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import moment, { type Moment } from 'moment';
	import type { DailyPrayer } from '../types/DailyPrayer';
	import '../assets/AboveClouds.png';
	import { getPrayerTimes } from './components/getPrayerTimes';
	import type { TodaysPrayer } from '../types/DailyPrayer';
	import { Capacitor } from '@capacitor/core';
	import type { NotificationType, Notifications } from '../types/Notifications';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import nightA from '../assets/nightA.webm';

	let emblaApi: any;
	let options = { loop: true, startIndex: 6 };
	let plugins: any = [];

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
	let displayedPrayers: TodaysPrayer = {
		fajr: { time: '', notification: 'Ring' },
		sunrise: { time: '', notification: 'Ring' },
		dhuhr: { time: '', notification: 'Ring' },
		asr: { time: '', notification: 'Ring' },
		maghrib: { time: '', notification: 'Ring' },
		isha: { time: '', notification: 'Ring' }
	};
	let prayerObject: { [key: string]: DailyPrayer } = {};
	let notificationSettings: Notifications;

	const onInit = (event: any) => {
		emblaApi = event.detail;
		emblaApi.on('select', () => {
			console.log('Slide changed to:', emblaApi.selectedScrollSnap());
		});
	};

	const scrollPrev = () => {
		emblaApi.scrollPrev();
	};

	const scrollNext = () => {
		emblaApi.scrollNext();
	};

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
		// cleanHijriDateString = `${dArray[0]}, ${dArray[2]}`;
		return `${dArray[0]}, ${dArray[2]}`;
	};
	//find which prayer is next
	const findNextPrayer = async () => {
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

			timeRemaining = `${hours} hr ${minutes + 1} min`;
		}
	};

	const handleNotificationsButtonClick = (prayer: string) => (event: MouseEvent) => {
		const currentNotificationType: NotificationType = notificationSettings[prayer];

		console.log(currentNotificationType, 'currentNotificationType');
		let newNotificationType: NotificationType;
		switch (currentNotificationType) {
			case 'Ring':
				newNotificationType = 'Vibrate';
				break;
			case 'Vibrate':
				newNotificationType = 'Silent';
				break;
			case 'Silent':
				newNotificationType = 'Ring';
				break;
			default:
				console.error(`Unknown notification type: ${currentNotificationType}`);
				return;
		}
		//update the localstorage preference of notification type
		notificationSettings[prayer as keyof Notifications] = newNotificationType;
		localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
		//update the UI for displayedPrayers notification type
		displayedPrayers[prayer as keyof TodaysPrayer].notification =
			newNotificationType as NotificationType;
	};

	const getNotificationSetting = (prayer: string) => {
		return notificationSettings[prayer as keyof Notifications];
	};

	onDestroy(() => {
		clearInterval(intervalId);
	});

	const prayerTimesObject = async () => {
		prayerObject[`Today, ${moment().format('MMMM Do YYYY')}`] = prayerTimes!;
		for (let i = 1; i <= 6; i++) {
			const nextDate = moment().add(i, 'days').format('DD-MM-YYYY');
			const nextPrayerTimes = await getPrayerTimes(nextDate);
			prayerObject[moment(nextDate, 'DD-MM-YYYY').format('dddd, MMMM Do YYYY')] = nextPrayerTimes!;
		}
		let prevPrayerObject: { [key: string]: DailyPrayer } = {};
		for (let i = 1; i <= 6; i++) {
			const prevDate = moment().subtract(i, 'days').format('DD-MM-YYYY');
			const nextPrayerTimes = await getPrayerTimes(prevDate);
			prevPrayerObject[moment(prevDate, 'DD-MM-YYYY').format('dddd, MMMM Do YYYY')] =
				nextPrayerTimes!;
			if (moment(prevDate, 'DD-MM-YYYY').date() === 1) {
				break;
			}
		}
		const reversedPrevPrayerObject = Object.fromEntries(Object.entries(prevPrayerObject).reverse());
		prayerObject = { ...prayerObject, ...reversedPrevPrayerObject };
		console.log(prayerObject, 'prayerObject');
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
			// cleanHijriDate(prayerTimes?.hijriDate);
			//update time remaining unti next prayer every 3 seconds
			updateTimeRemaining();
			intervalId = setInterval(updateTimeRemaining, 3000);
			for (const [prayer, timeString] of Object.entries(prayerTimes!)) {
				if (prayer === 'hijriDate' || prayer === 'hijriMonth') continue;
				displayedPrayers[prayer as keyof TodaysPrayer] = {
					time: timeString,
					notification: getNotificationSetting(prayer)
				};
			}
		}
	};

	onMount(async () => {
		loading = true;
		prayerTimes = await getPrayerTimes(moment().format('DD-MM-YYYY'));
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
		prepareData();
		prayerTimesObject();
		loading = false;
	});
</script>

<!-- pb for smaller screens to give padding
	94px for the bottom nav + 30px for top padding + the bottom padding from inset or 20px -->

<main
	class="flex flex-col overflow-auto pb-10"
	style="height: {Capacitor.getPlatform() === 'ios'
		? 'calc(100vh - (94px + env(safe-area-inset-bottom)))'
		: 'calc(100vh - (94px + 20px))'}"
>
	<!-- <video class="absolute top-0 left-0 w-full bg-cover -z-10" autoplay muted loop src={nightA} /> -->
	<img
		src="src/assets/newnight.png"
		alt="night-sky-background"
		class="absolute top-0 left-0 w-full object-fill -z-10"
		style="height: {Capacitor.getPlatform() === 'ios'
			? 'calc(100vh - (64px + env(safe-area-inset-bottom)))'
			: 'calc(100vh - (64px + 20px))'}"
	/>
	<div>
		<!-- <div class="w-full flex-grow bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"> -->
		{#if loading}
			<div>Loading...</div>
		{:else if errorState}
			<div>Error...</div>
		{:else}
			<div class="flex justify-between mb-6 ml-2 mr-2 text-white">
				<h3 class="font-bold">Prayers</h3>
				<div class="flex">
					<img class="w-6 h-6 white mr-1" src="src/assets/location.png" alt="Location" />
					<h3 class="font-serif">
						{capitalizeFirstLetter(currentCity)},
						{capitalizeFirstLetter(currentCountry)}
					</h3>
				</div>
			</div>

			<div class=" w-full glass backdrop-blur-none h-32 mb-10">
				<article class=" flex flex-row ml-2 items-center pt-2 pb-2">
					<h1 class=" text-white font-extrabold text-4xl w-1/2">
						{capitalizeFirstLetter(nextPrayer)}
					</h1>
					<h1 class="text-white text-3xl font-semibold mt-1 w-1/2">
						{nextPrayerTime}
					</h1>
				</article>
				<article class="flex flex-row ml-3 items-center mt-3">
					<h2 class="text-white font-medium text-2xl w-1/2">Athan In:</h2>
					<h2 class="text-white font-mono mt-1 text-2xl w-1/2">
						{timeRemaining}
					</h2>
				</article>
			</div>

			<div class="embla pt-6" use:emblaCarouselSvelte={{ options, plugins }} on:emblaInit={onInit}>
				<div class="embla__container">
					{#each Object.entries(prayerObject) as [date, prayerTimes]}
						<div class="embla__slide">
							<div class="flex mb-4 text-center">
								<button class="embla__prev" style="flex: 0.5" on:click={scrollPrev}>left</button>
								<div style="flex: 1">
									<div class="text-white">{date}</div>
									<div class="text-white">
										{prayerTimes?.hijriMonth}
										{cleanHijriDate(prayerTimes?.hijriDate)}
									</div>
								</div>
								<button style="flex: 0.5" class="embla__next" on:click={scrollNext}>right</button>
							</div>
							<div class="flex w-full justify-center align-middle">
								<article
									class="w-11/12 text-center glass text-white pl-2 bg-black bg-opacity-[0.3]"
								>
									{#each Object.entries(prayerTimes) as [prayer, time]}
										{#if prayer !== 'hijriDate' && prayer !== 'hijriMonth'}
											<div class="flex justify-between items-center pb-5 pt-5 text-lg">
												<h4 class="font-serif">{capitalizeFirstLetter(prayer)}:</h4>
												<div class="flex items-center mr-2">
													<h4 class="font-mono">{time}</h4>
													<button
														class=" btn-xs ml-2 w-10"
														on:click={handleNotificationsButtonClick(prayer)}
													>
														{#if notificationSettings[prayer] === 'Ring'}
															<img class="w-6 h-6" src="src/assets/volume.png" alt="Volume" />
														{:else if notificationSettings[prayer] === 'Vibrate'}
															<img class="w-7 h-7" src="src/assets/vib.png" alt="Vibrate" />
														{:else}
															<img
																class="w-7 h-7"
																src="src/assets/silent.png"
																alt="notifications-disabled"
															/>
														{/if}
													</button>
												</div>
											</div>
										{/if}
									{/each}
								</article>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</main>

<!-- <div class="flex mb-4 text-center">
				<div class="flex-auto">left</div>
				<div class="flex-auto">
					<div class="text-red-400">{currentDate}</div>
					<div class="text-red-400">
						{prayerTimes?.hijriMonth}
						{cleanHijriDateString}
					</div>
				</div>
				<div class="flex-auto">right</div>
			</div>
			<div class="flex w-full justify-center align-middle">
				<article class="w-11/12 text-center glass text-white pl-2">
					{#if displayedPrayers}
						{#each Object.entries(displayedPrayers) as [prayer, values]}
							{#if prayer !== 'hijriDate' && prayer !== 'hijriMonth'}
								<div class="flex justify-between items-center mb-5 mt-5">
									<h4 class="">{capitalizeFirstLetter(prayer)}:</h4>
									<h4 class="flex items-center mr-2 font-mono">
										<div>{values.time}</div>
										<button
											class=" btn-xs ml-2 w-10"
											on:click={handleNotificationsButtonClick(prayer, values.notification)}
										>
											{#if values.notification === 'Ring'}
												<img class="w-6 h-6" src="src/assets/volume.png" alt="Volume" />
											{:else if values.notification === 'Vibrate'}
												<img class="w-7 h-7" src="src/assets/vib.png" alt="Vibrate" />
											{:else}
												<img
													class="w-7 h-7"
													src="src/assets/silent.png"
													alt="notifications-disabled"
												/>
											{/if}
										</button>
									</h4>
								</div>
							{/if}
						{/each}
					{/if}
				</article>
			</div> -->

<style>
	.embla {
		overflow: hidden;
	}
	.embla__container {
		display: flex;
	}
	.embla__slide {
		flex: 0 0 100%;
		min-width: 0;
	}
</style>
