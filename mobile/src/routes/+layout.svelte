<script>
	import { Capacitor } from '@capacitor/core';
	import '../app.css';
	import BottomNav from './components/BottomNav.svelte';
</script>

<div class="flex-grow w-full h-full pb-10">
	<div
		style="padding-top: {Capacitor.getPlatform() === 'ios' ? 'env(safe-area-inset-top)' : '30px'}"
	>
		<slot />
		<BottomNav />
	</div>
</div>
