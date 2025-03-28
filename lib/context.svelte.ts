import { Context } from 'runed';
import { untrack } from 'svelte';
import { createEffect, type ReadonlyRef } from 'svelte-freeze';

import { events, type MatchedRouteState } from './state.svelte';
import { onCleanup } from './utils.svelte';

export interface ViewContextObject {
	route: MatchedRouteState;
	isActive: () => boolean;
}

export const viewContext = new Context<ViewContextObject>('svelte-stakkr/view');

export const useParams = <T extends Record<string, string>>(): T => {
	const context = viewContext.get();
	return context.route.params as T;
};

export const onRouteEnter = (callback: () => void) => {
	const { route, isActive } = viewContext.get();

	if (untrack(isActive)) {
		callback();
	}

	onCleanup(events.on(route.id, (e) => e.enter && callback()));
};

export const useIsFocused = (): ReadonlyRef<boolean> => {
	const { isActive } = viewContext.get();

	return {
		get value() {
			return isActive();
		},
	};
};

export const createFocusEffect = (fn: () => void | (() => void)): void => {
	const { isActive } = viewContext.get();

	// Using $effect here because there isn't anything noteworthy
	$effect(() => {
		if (isActive()) {
			createEffect(fn);
		}
	});
};

export const useTitle = (title: () => string): void => {
	createFocusEffect(() => {
		document.title = title();
	});
};
