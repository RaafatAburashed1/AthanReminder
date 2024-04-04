<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import moment from 'moment';
	import type { DailyPrayer } from '../types/DailyPrayer';
	import { getPrayerTimes } from './components/getPrayerTimes';
	import type { TodaysPrayer } from '../types/DailyPrayer';
	import { Capacitor } from '@capacitor/core';
	import type { NotificationType, Notifications } from '../types/Notifications';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import silent2 from '../assets/icons8-no-audio-50-red.png';
	import minaret from '../assets/icons8-minaret-64.png';
	import loc from '../assets/loc.png';
	import leftIcon from '../assets/leftWhite.png';
	import rightIcon from '../assets/rightWhite.png';
	import beep from '../assets/beep.png';
	import bg3 from '../assets/backgrounds/bg2.png';
	import { LocalNotifications } from '@capacitor/local-notifications';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { activeButton } from '$lib/stores/activeButton';

	/*
		TODO IOS testing
		- check if notifications are working
		- if not just do silent notifcations only
		- get app screenshots
		- deploy on ios
		TODO icon for IOS
		TODO remove console logs
	*/

	let showAlert = false;
	let currentAlertMessage: string;
	let timeoutId: any;
	let emblaApi: any;
	let options = { loop: true, startIndex: 6 };
	let plugins: any = [];

	let prayerTimes: DailyPrayer | undefined;
	// let currentCity: string, currentState: string, currentCountry: string;
	let loading: boolean = true;
	let errorState: boolean = false;
	let currentDate: string = moment().format('dddd, MMMM Do YYYY');
	let nextPrayer: string, nextPrayerTime: string;
	// let cleanHijriDateString: string;
	let intervalId: any;
	let timeRemaining: string;
	let todayFinished: boolean = false;
	let displayedPrayers: TodaysPrayer = {
		fajr: { time: '', notification: 'Athan' },
		sunrise: { time: '', notification: 'Athan' },
		dhuhr: { time: '', notification: 'Athan' },
		asr: { time: '', notification: 'Athan' },
		maghrib: { time: '', notification: 'Athan' },
		isha: { time: '', notification: 'Athan' }
	};
	// let prayerObject: { [key: string]: DailyPrayer } = {};
	let prayerMapping = new Map<string, DailyPrayer>();
	let notificationSettings: Notifications;
	let notificationPrayerMap = new Map<string, DailyPrayer>();
	let currentLocationString: string;

	const onInit = (event: any) => {
		emblaApi = event.detail;
		// emblaApi.on('select', () => {
		// 	console.log('Slide changed to:', emblaApi.selectedScrollSnap());
		// });
	};

	const scrollPrev = () => {
		emblaApi.scrollPrev();
	};

	const scrollNext = () => {
		emblaApi.scrollNext();
	};
	const setCityStateCountry = (location: string) => {
		const locationArray = location!.split('-');
		// currentCity = locationArray[0];
		// currentState = locationArray[1];
		// currentCountry = locationArray[2];
		if (locationArray[0] === locationArray[2]) {
			currentLocationString = capitalizeFirstLetter(locationArray[0]);
		} else {
			currentLocationString = `${capitalizeFirstLetter(locationArray[0])}, ${capitalizeFirstLetter(locationArray[2])}`;
		}
	};

	const capitalizeFirstLetter = (str: string): string => {
		if (str === undefined) return '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	//format the hijri date
	const cleanHijriDate = (str: string | undefined) => {
		if (str === undefined) return '';
		const dArray = str!.split('-');
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
	const updateTimeRemaining = async () => {
		const now = moment();
		let nextPrayerMoment = moment(nextPrayerTime, 'hh:mm A');
		if (todayFinished) {
			nextPrayerMoment = nextPrayerMoment.add(24, 'hours');
		}
		const diff = nextPrayerMoment.diff(now);
		if (diff <= 0) {
			clearInterval(intervalId);
			await findNextPrayer();
			updateTimeRemaining();
		} else {
			const hours = Math.floor(moment.duration(diff).asHours());
			const minutes = moment.duration(diff).minutes();

			timeRemaining = `${hours} hr ${minutes + 1} min`;
		}
	};

	const handleNotificationsButtonClick = async (prayer: string) => {
		const currentNotificationType: NotificationType = notificationSettings[prayer];
		let newNotificationType: NotificationType;
		switch (currentNotificationType) {
			case 'Athan':
				newNotificationType = 'Beep';
				break;
			case 'Beep':
				newNotificationType = 'Silent';
				break;
			case 'Silent':
				newNotificationType = 'Athan';
				break;
			default:
				console.error(`Unknown notification type: ${currentNotificationType}`);
				return;
		}
		//create the alert and its message
		currentAlertMessage = newNotificationType;
		removeModalAlert();

		//update the localstorage preference of notification type
		notificationSettings[prayer as keyof Notifications] = newNotificationType;
		localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
		//update the UI for displayedPrayers notification type
		displayedPrayers[prayer as keyof TodaysPrayer].notification =
			newNotificationType as NotificationType;

		//update the notification schedule
		await setNotificationSchedule(notificationPrayerMap);
	};

	const removeModalAlert = () => {
		if (timeoutId) {
			showAlert = false;
			clearTimeout(timeoutId);
		}

		showAlert = true;
		timeoutId = setTimeout(() => {
			showAlert = false;
		}, 2000);
	};

	const getNotificationSetting = (prayer: string) => {
		return notificationSettings[prayer as keyof Notifications];
	};

	onDestroy(() => {
		clearInterval(intervalId);
	});

	const prayerTimesObject = async () => {
		// Set previous prayer times
		let currentMonth = moment().month();
		for (let i = 1; i <= 6; i++) {
			// const prevDate = moment().subtract(i, 'days').format('DD-MM-YYYY');
			const prevDate = moment().subtract(i, 'days');

			if (prevDate.month() !== currentMonth || prevDate.date() === 1) {
				break;
			}
			const formattedPrevDate = prevDate.format('DD-MM-YYYY');
			const nextPrayerTimes = await getPrayerTimes(formattedPrevDate);
			prayerMapping.set(
				moment(formattedPrevDate, 'DD-MM-YYYY').format('dddd, MMMM Do YYYY'),
				nextPrayerTimes!
			);
		}

		// Reverse the prayerMapping
		const reversedPrayerMapping = new Map([...prayerMapping.entries()].reverse());
		prayerMapping = reversedPrayerMapping;

		// Add today's prayer times to the set
		const futureMap = new Map<string, DailyPrayer>();
		const today = `Today, ${moment().format('MMMM Do YYYY')}`;
		futureMap.set(today, prayerTimes!);

		// Set future prayer times
		for (let i = 1; i <= 6; i++) {
			const nextDate = moment().add(i, 'days').format('DD-MM-YYYY');
			const nextPrayerTimes = await getPrayerTimes(nextDate);
			futureMap.set(moment(nextDate, 'DD-MM-YYYY').format('dddd, MMMM Do YYYY'), nextPrayerTimes!);
		}

		// Set the notification schedule so anytime the user changes notifaication settings it updates the local notifications
		notificationPrayerMap = new Map(futureMap.entries());
		await setNotificationSchedule(notificationPrayerMap);

		// let prevPrayerMap = new Map();

		// Merge previous prayer times into the main map
		for (const [key, value] of futureMap) {
			prayerMapping.set(key, value);
		}

		const index = Array.from(prayerMapping.keys()).indexOf(today);
		options.startIndex = index;
		// console.log(prayerMapping, 'prayerMap from times');
	};

	const prepareData = () => {
		if (prayerTimes === undefined) {
			errorState = true;
			localStorage.clear();

			//get them to manually set location
			//TODO need to update the button to go to settings
			//open a modal to handle manual location setting
			activeButton.set(2);
			goto('/settings');
		} else {
			const location = localStorage.getItem('location');
			setCityStateCountry(location!);
			findNextPrayer();
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

	const setNotificationSchedule = async (
		futurePrayers: Map<string, DailyPrayer>
	): Promise<void> => {
		try {
			const checkPermissions = await LocalNotifications.checkPermissions();
			//only schedule notifications if the user has granted permissions
			if (checkPermissions.display === 'granted') {
				await cancelNotifications();
				const notifications: { title: string; body: string; id: number }[] = [];
				for (const [date, prayerTimes] of futurePrayers) {
					const actualDate = date.startsWith('Today') ? moment().format('dddd MMMM Do YYYY') : date;
					for (const [prayer, time] of Object.entries(prayerTimes)) {
						if (prayer === 'hijriDate' || prayer === 'hijriMonth') continue;
						const fullDateTime = `${actualDate} ${time}`;
						const prayerTime = moment(fullDateTime, 'ddd MMM D YYYY h:mm A');
						if (prayerTime.isAfter(moment())) {
							const getNoti = getNotificationSetting(prayer);
							const notificationType =
								getNoti === 'Athan' ? 'adhan_makkah.wav' : getNoti === 'Beep' ? 'beep2.wav' : '';
							//TODO allow while idle for Android https://forum.ionicframework.com/t/android-ionic-local-notifications-are-not-delivered-on-time/238986
							const notification = {
								title: `${capitalizeFirstLetter(prayer)} Prayer`,
								body: `${capitalizeFirstLetter(prayer)} Prayer ${time}`,
								id: Math.floor(Math.random() * 10000),
								schedule: { at: prayerTime.toDate() },
								sound: notificationType
							};
							notifications.push(notification);
						}
					}
				}
				// // Schedule the notifications
				await LocalNotifications.schedule({ notifications });
				// const nots = await LocalNotifications.getPending();
				// console.log(JSON.stringify(nots.notifications), 'notshahadnsamdsajd');
			}
		} catch (error) {
			console.error('error', error);
		}
	};

	const cancelNotifications = async (): Promise<void> => {
		const { notifications } = await LocalNotifications.getPending();
		try {
			const value = await LocalNotifications.cancel({
				notifications: notifications.map((n) => ({ id: n.id }))
			});
		} catch (error) {
			console.error('error', error);
		}
	};

	onMount(async () => {
		loading = true;
		const permissions = await LocalNotifications.checkPermissions();
		if (permissions.display === 'prompt') {
			//set flag to show modal component where it asks for permissions
			await LocalNotifications.requestPermissions();
		}

		prayerTimes = await getPrayerTimes(moment().format('DD-MM-YYYY'));
		if (prayerTimes === undefined) {
			activeButton.set(2);
			goto('/settings');
		}

		const getNoti: string | null = localStorage.getItem('notificationSettings');
		if (getNoti === null) {
			notificationSettings = {
				fajr: 'Athan',
				sunrise: 'Athan',
				dhuhr: 'Athan',
				asr: 'Athan',
				maghrib: 'Athan',
				isha: 'Athan'
			};
			localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
		} else {
			notificationSettings = JSON.parse(getNoti);
		}
		prepareData();
		await prayerTimesObject();
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
	<img
		src={bg3}
		alt="night-sky-background"
		class="absolute top-0 left-0 w-full object-fill -z-10"
		style="height: {Capacitor.getPlatform() === 'ios'
			? 'calc(100vh - (44px + env(safe-area-inset-bottom)))'
			: 'calc(100vh - (44px + 20px))'}"
	/>

	<div>
		{#if loading}
			<!-- Skeleton for the header -->
			<div class="flex justify-between mb-6 ml-2 mr-2 bg">
				<div class="skeleton w-32 h-6"></div>
				<div class="flex">
					<div class="skeleton w-32 h-6"></div>
				</div>
			</div>

			<!-- Skeleton for the prayer details -->
			<div class="w-full glass backdrop-blur-none pt-4 pb-4 mb-10 pr-2">
				<article class="flex flex-row ml-2 items-center pt-2 pb-2">
					<div class="skeleton w-full h-10"></div>
				</article>
				<article class="flex flex-row ml-3 items-center mt-3">
					<div class="skeleton w-full h-10"></div>
				</article>
			</div>

			<!-- Skeleton for the carousel -->
			<div class=" pt-6">
				<div class="flex mb-4 text-center">
					<div class="skeleton w-full h-10 mx-2"></div>
				</div>
				<div class="flex w-full justify-center align-middle">
					<div class="skeleton w-11/12 h-96"></div>
				</div>
			</div>
		{:else if errorState}
			<div>Error...</div>
		{:else}
			<div class="flex justify-between mb-6 ml-2 mr-2 text-white">
				<h3 class="font-bold">Prayers</h3>
				<div class="flex">
					<img class="w-6 h-6 mr-1" src={loc} alt="Location" />
					<h3 class="font-serif">
						{capitalizeFirstLetter(currentLocationString)}
					</h3>
				</div>
			</div>

			<div
				class=" w-full glass backdrop-blur-none pt-4 pb-4 mb-10"
				style="background-image: linear-gradient(135deg,rgb(255 255 255 / var(--glass-opacity, 30%)) 0%, rgb(0 0 0 / 0%) 100%), linear-gradient(var(--glass-reflex-degree, 90deg), rgb(255 255 255 / var(--glass-reflex-opacity, 10%)) 29%, rgb(0 0 0 / 0%) 25%)"
			>
				<article class="flex flex-row ml-2 items-center pt-2 pb-2">
					<h1 class="text-white font-extrabold text-4xl w-1/2 pl-1">
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

			{#if showAlert}
				<div
					class="alert flex absolute w-1/4 h-10 z-10 bg-zinc-700 bg-opacity-90 rounded-sm text-center justify-center"
					style=" left: 50%; transform: translate(-50%, -50%); top: 240px;"
					transition:fade={{ duration: 500 }}
				>
					<span class="text-white">{currentAlertMessage} </span>
				</div>
			{/if}

			<div class="embla pt-6" use:emblaCarouselSvelte={{ options, plugins }} on:emblaInit={onInit}>
				<div class="embla__container">
					{#each prayerMapping as [date, prayerTimes]}
						<div class="embla__slide">
							<div class="flex mb-4 text-center">
								<button class="embla__prev" style="flex: 0.5" on:click={scrollPrev}
									><img src={leftIcon} alt="Left" /></button
								>
								<div style="flex: auto">
									<div class="text-white font-bold">{date}</div>
									<div class="text-white font-bold">
										{prayerTimes?.hijriMonth}
										{cleanHijriDate(prayerTimes?.hijriDate)}
									</div>
								</div>
								<button style="flex: 0.5" class="embla__next" on:click={scrollNext}
									><img src={rightIcon} alt="Right" /></button
								>
							</div>
							<div class="flex w-full justify-center align-middle">
								<article
									class="w-11/12 text-center glass text-white pl-2 bg-black bg-opacity-[0.5]"
									style="background-image: linear-gradient(135deg,rgb(255 255 255 / var(--glass-opacity, 30%)) 0%, rgb(0 0 0 / 0%) 100%), linear-gradient(var(--glass-reflex-degree, 90deg), rgb(255 255 255 / var(--glass-reflex-opacity, 10%)) 29%, rgb(0 0 0 / 0%) 25%)"
								>
									{#each Object.entries(prayerTimes) as [prayer, time]}
										{#if prayer !== 'hijriDate' && prayer !== 'hijriMonth'}
											<div class="flex justify-between items-center pb-5 pt-5 text-lg">
												<h4 class="font-serif">{capitalizeFirstLetter(prayer)}:</h4>
												<div class="flex items-center mr-2">
													<h4 class="font-mono">{time}</h4>
													<button
														class=" btn-xs ml-2 w-10"
														on:click={() => handleNotificationsButtonClick(prayer)}
													>
														{#if notificationSettings[prayer] === 'Athan'}
															<img src={minaret} alt="Athan" />
														{:else if notificationSettings[prayer] === 'Beep'}
															<img src={beep} alt="Beep" />
														{:else}
															<img src={silent2} alt="notifications-disabled" />
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
