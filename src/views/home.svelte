<svelte:options runes />

<script lang="ts">
	import { appHistory } from '../globals/navigation';
</script>

<p>Hello world!</p>

<div>
	<button onclick={() => appHistory.navigate('/counter')}>Push a counter view</button>
</div>
