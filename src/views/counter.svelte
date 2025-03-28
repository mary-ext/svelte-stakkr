<script lang="ts">
	import { appHistory } from '../globals/navigation';

	let count = $state(0);
</script>

<div>
	<h3>{count}</h3>
	<button onclick={() => count++}>Increment</button>
	<button onclick={() => count--}>Decrement</button>
</div>

<pre>{JSON.stringify(appHistory.location.state)}</pre>

<p>
	Mess around with the counter above, then try pushing a new view and coming back to this one. Local states
	should be preserved.
</p>

<div>
	<button onclick={() => appHistory.navigate('/counter')}>Push another counter view</button>
	<button onclick={() => appHistory.update({ rand: Math.random() })}>Update current entry</button>
</div>
