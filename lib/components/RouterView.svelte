<script lang="ts">
	import type { Snippet } from 'svelte';

	import { state, type MatchedRouteState } from '../state.svelte';

	import View from './View.svelte';

	interface Props {
		render?: Snippet<[route: MatchedRouteState]>;
	}

	const { render = DefaultRender }: Props = $props();
</script>

{#snippet DefaultRender(matched: MatchedRouteState)}
	<matched.def.component />
{/snippet}

<div class="stakkr-router-view">
	{#each Object.values(state.value.views) as matched (matched.id)}
		<View {matched} {render} />
	{/each}

	{#each Object.values(state.value.singles) as matched (matched.id)}
		<View {matched} {render} />
	{/each}
</div>

<style>
	.stakkr-router-view {
		display: contents;
	}
</style>
