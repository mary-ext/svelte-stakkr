<svelte:options runes />

<script lang="ts">
	import { matchedRoute, RouterView } from '../lib/index.js';

	import { logger } from './globals/navigation.js';

	let active = $state.raw<string>();
	let entries = $state.raw<(string | null)[]>([]);

	$effect(() => {
		active = matchedRoute.value?.id;
		entries = logger.entries.map((e) => (e ? e.pathname : null));
	});
</script>

<div>
	<p>active: <code>{active}</code></p>
	<p>entries: <code>{JSON.stringify(entries)}</code></p>
</div>

<RouterView />
