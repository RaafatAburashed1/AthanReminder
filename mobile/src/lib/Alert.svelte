<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	export let message = '';
	export let show = true;

	onMount(() => {
		if (show) {
			setTimeout(() => {
				show = false;
			}, 3000);
		}
	});
</script>

{#if show}
	<div
		class="alert absolute z-10 bg-gray-500 bg-opacity-90 w-1/3 rounded-none"
		style=" left: 50%; transform: translate(-50%, -50%);"
		transition:fade={{ duration: 500 }}
	>
		{message}
	</div>
{/if}
