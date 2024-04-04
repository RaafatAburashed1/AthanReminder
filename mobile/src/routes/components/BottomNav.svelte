<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import { activeButton } from '$lib/stores/activeButton';
	let currentPath: string;
	$: currentPath = $page.url.pathname;
	// let activeButton: number;

	function handleButtonClick(buttonId: number) {
		// activeButton = buttonId;
		activeButton.set(buttonId);
		if (buttonId === 1) {
			goto('/');
		} else {
			goto('/settings');
		}
	}
	onMount(() => {
		// activeButton = currentPath === '/' ? 1 : 2;
	});
</script>

<main>
	<div
		class="btm-nav"
		style="margin-bottom: {Capacitor.getPlatform() === 'ios'
			? 'calc(env(safe-area-inset-bottom) - 20px)'
			: '15px'}"
	>
		<button
			class="text-accent"
			on:click={() => handleButtonClick(1)}
			class:active={$activeButton === 1}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				/></svg
			>
		</button>
		<button
			class="text-accent"
			on:click={() => handleButtonClick(2)}
			class:active={$activeButton === 2}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
		</button>
	</div>
</main>
