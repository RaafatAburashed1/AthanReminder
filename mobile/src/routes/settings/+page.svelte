<script lang="ts">
	import { Capacitor } from '@capacitor/core';
	import { onMount } from 'svelte';
	import type { ICountry, IState, ICity } from '../../types/Country.ts';
	import { getAllCountries, getCitiesOfState, getStatesOfCountry } from '../../lib/country/country';
	import loc from '../../assets/loc.png';
	import bg from '../../assets/backgrounds/bg1.png';
	import info from '../../assets/infoIcon.png';
	//@ts-ignore
	import AutoComplete from 'simple-svelte-autocomplete';
	import { getPrayerTimes } from '../components/getPrayerTimes.js';
	import moment from 'moment';

	let currentLocation: string | null;
	let currentLocationArray: string[];
	let currentLocationString: string;

	let countries: ICountry[] = [];
	let states: IState[] = [];
	let cities: ICity[] = [];
	let selectedCountry: any;
	let selectedState: any;
	let selectedCity: any;
	let loading = true;
	let hideCitiesField = false;
	let hideStatesField = false;
	let alertMessage = '';
	let showAlert = false;
	let isSaveLoading = false;

	$: if (selectedCountry || selectedState) {
		hideCitiesField = false;
	}

	$: if (selectedState || selectedCountry || selectedCity) {
		alertMessage = '';
		showAlert = false;
	}

	const selectCountry = (country: any) => {
		selectedState = 'Select a State';
		selectedCity = 'Select a City';
		if (country === undefined || country === 'Select a Country') return;

		//reset other fields
		states = getStatesOfCountry(country.isoCode);

		if (states.length === 0) {
			hideStatesField = true;
		} else {
			hideStatesField = false;
		}
	};

	const selectState = (state: any, country: any) => {
		if (state === 'Select a State' || country === 'Select a Country') return;
		selectedCity = 'Select a City';
		cities = getCitiesOfState(country.isoCode, state.isoCode);
		if (cities.length === 0) {
			hideCitiesField = true;
		}
	};

	const selectCity = (city: any) => {
		selectedCity = city;
	};

	const capitalizeFirstLetter = (str: any): string => {
		if (str === undefined) return '';
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	const submitLocationButton = async () => {
		isSaveLoading = true;
		if (selectedCountry === 'Select a Country') {
			alertMessage = 'Please select a country';
			showAlert = true;
			return;
		}
		if (selectedState === 'Select a State' && !hideStatesField) {
			alertMessage = 'Please select a state';
			showAlert = true;
			return;
		}
		if (selectedCity === 'Select a City' && !hideCitiesField && !hideStatesField) {
			alertMessage = 'Please select a city';
			showAlert = true;
			return;
		}

		const country = selectedCountry.name.toLowerCase();
		let state;
		if (!hideCitiesField && !hideStatesField) {
			const city = selectedCity.name.toLowerCase();
			state = selectedState.name.toLowerCase();
			currentLocation = `${city}-${state}-${country}`;
		} else if (hideStatesField) {
			currentLocation = `${country}-${country}-${country}`;
		} else {
			state = selectedState.name.toLowerCase();
			currentLocation = `${state}-${state}-${country}`;
		}
		localStorage.setItem('location', currentLocation);
		localStorage.removeItem('prayerTimes');
		await getPrayerTimes(moment().format('DD-MM-YYYY'));
		window.location.reload();
	};

	onMount(() => {
		loading = true;
		currentLocation = localStorage.getItem('location');
		if (!currentLocation) {
			currentLocation = 'Location unknown';
		}
		currentLocationArray = currentLocation.split('-');
		if (currentLocationArray[0] === currentLocationArray[2]) {
			currentLocationString = capitalizeFirstLetter(currentLocationArray[0]);
		} else {
			currentLocationString = `${capitalizeFirstLetter(currentLocationArray[0])}, ${capitalizeFirstLetter(currentLocationArray[2])}`;
		}
		countries = getAllCountries();
		selectedCountry = 'Select a Country';
		loading = false;
	});
</script>

<main
	class="flex flex-col overflow-auto pb-10 w-full"
	style="height: {Capacitor.getPlatform() === 'ios'
		? 'calc(100vh - (94px + env(safe-area-inset-bottom)))'
		: 'calc(100vh - (94px + 20px))'}"
>
	<img
		src={bg}
		alt="night-sky-background"
		class="absolute top-0 left-0 w-full object-fill -z-10"
		style="height: {Capacitor.getPlatform() === 'ios'
			? 'calc(100vh - (44px + env(safe-area-inset-bottom)))'
			: 'calc(100vh - (44px + 20px))'}"
	/>
	{#if !loading}
		<div
			class="flex flex-col mt-8 mb-10 justify-center text-center align-middle items-center text-white glass backdrop-blur-sm"
		>
			<div class="mb-4">
				<h3 class="font-bold">Your Current Location:</h3>
				<div class="flex flex-row justify-center text-center align-middle items-center mt-2">
					<img class="w-6 h-6" src={loc} alt="Location" />
					<h3>
						{currentLocationString}
					</h3>
				</div>
			</div>
			<div class="flex flex-row">
				<img class="w-5 h-5 mt-px mr-1" src={info} alt="Information" />
				<p class="font-thin">If This Location Is Incorrect Please Set It Below</p>
			</div>
		</div>
		<div class="flex mb-4">
			<AutoComplete
				className="w-full ml-2 mr-2 rounded-md"
				items={countries}
				bind:selectedItem={selectedCountry}
				onChange={() => selectCountry(selectedCountry)}
				labelFieldName="name"
				placeholder="Select a Country"
			/>
		</div>
		{#if !hideStatesField}
			<div class="flex mb-4">
				<AutoComplete
					className="w-full ml-2 mr-2 rounded-md"
					items={states}
					bind:selectedItem={selectedState}
					placeholder="Select a State"
					labelFieldName="name"
					onChange={() => selectState(selectedState, selectedCountry)}
					disabled={selectedCountry === 'Select a Country'}
				/>
			</div>
			{#if !hideCitiesField}
				<div class="flex mb-4">
					<AutoComplete
						className="w-full ml-2 mr-2 rounded-md"
						items={cities}
						bind:selectedItem={selectedCity}
						onChange={() => selectCity(selectedCity)}
						labelFieldName="name"
						placeholder="Select a City"
						disabled={selectedState === 'Select a State'}
					/>
				</div>
			{/if}
		{/if}

		<button
			class="btn ml-2 mr-2 text-white"
			style="background-color: #009589;"
			on:click={() => submitLocationButton()}
		>
			{#if isSaveLoading}
				<span class="loading loading-spinner"></span>
			{/if}
			Save</button
		>
		{#if showAlert}
			<div
				role="alert"
				class="flex alert ml-4 mt-5 h-18 bg-red-800 justify-center items-center rounded-sm w-11/12 text-white"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/></svg
				>
				<span>{alertMessage}</span>
			</div>
		{/if}
	{/if}
</main>
