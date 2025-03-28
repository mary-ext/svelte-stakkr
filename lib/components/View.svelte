<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Freeze } from 'svelte-freeze';

	import { viewContext } from '../context.svelte';
	import { state, type MatchedRouteState } from '../state.svelte';

	interface Props {
		matched: MatchedRouteState;
		render: Snippet<[route: MatchedRouteState]>;
	}

	const { matched: __matched, render: __render }: Props = $props();

	// Capturing the value because it doesn't need to be reactive
	const render = __render;
	const matched = __matched;

	const id = matched.id;

	const active = $derived(state.value.active === id);

	viewContext.set({
		route: matched,
		isActive: () => active,
	});
</script>

<div class={['stakkr-view', active ? 'is-active' : 'is-inactive']}>
	<Freeze frozen={!active}>
		{@render render(matched)}
	</Freeze>
</div>

<style>
	.stakkr-view {
		display: contents;
	}

	.is-inactive {
		display: none;
	}
</style>
