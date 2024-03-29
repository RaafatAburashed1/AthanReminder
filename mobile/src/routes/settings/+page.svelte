<script lang="ts">
	import { Capacitor } from '@capacitor/core';
	import { onMount } from 'svelte';
	let currentLocation: string | null;

	onMount(() => {
		currentLocation = localStorage.getItem('location');
		if (!currentLocation) {
			currentLocation = 'Location unknown';
		}
	});
</script>

<main
	class="flex flex-col overflow-auto pb-10"
	style="height: {Capacitor.getPlatform() === 'ios'
		? 'calc(100vh - (94px + env(safe-area-inset-bottom)))'
		: 'calc(100vh - (94px + 20px))'}"
>
	<div class="flex flex-col pt-3 pl-2">Current Location: {currentLocation}</div>
	<article class="flex flex-col pl-2 glass h-56">
		<div class="pt-3">If your location is incorrect please manually set it below</div>
		<div class="pt-3">Hello</div>
	</article>
</main>
