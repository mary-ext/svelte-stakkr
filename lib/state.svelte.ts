import { flushSync, type Component } from 'svelte';
import { createMemo, createState } from 'svelte-freeze';

import { EventEmitter } from './events.js';
import type { History, Location } from './history.js';
import type { HistoryLogger } from './logger.js';

import { onCleanup } from './utils.svelte';

export interface RouteMeta {}

export interface RouteDefinition {
	path: string;
	component: Component;
	single?: boolean;
	meta?: RouteMeta;
	validate?: (params: Record<string, string>) => boolean;
}

export interface RouterOptions {
	history: History;
	logger: HistoryLogger;
	routes: RouteDefinition[];
}

interface InternalRouteDefinition extends RouteDefinition {
	_regex?: RegExp;
}

interface MatchedRoute {
	readonly id: string | undefined;
	readonly def: RouteDefinition;
	readonly params: Record<string, string>;
}

export interface MatchedRouteState extends MatchedRoute {
	readonly id: string;
	scrollPos: { x: number; y: number } | undefined;
}

interface RouterState {
	active: string;
	views: Record<string, MatchedRouteState>;
	singles: Record<string, MatchedRouteState>;
}

let _entry: Location;

let _routes: InternalRouteDefinition[] | undefined;
let _cleanup: (() => void) | undefined;

export const state = createState<RouterState>({
	active: '',
	views: {},
	singles: {},
});

export const matchedRoute = createMemo((): MatchedRouteState | undefined => {
	const current = state.value;
	const active = current.active;

	const match = current.singles[active] || current.views[active];

	return match;
});

interface RouteEvent {
	focus: boolean;
	enter: boolean;
}

export const events = new EventEmitter<{ [key: string]: [event: RouteEvent] }>();

export const configureRouter = ({ history, logger: log, routes }: RouterOptions) => {
	_cleanup?.();
	_cleanup = $effect.root(() => {
		_routes = routes;
		_entry = log.current;

		{
			const pathname = _entry.pathname;
			const matched = matchRoute(pathname);

			if (matched) {
				const nextKey = matched.id || _entry.key;

				const isSingle = !!matched.id;
				const matchedState: MatchedRouteState = {
					...matched,
					id: nextKey,
					scrollPos: undefined,
				};

				const next: Record<string, MatchedRouteState> = { [nextKey]: matchedState };

				state.value = {
					active: nextKey,
					views: isSingle ? {} : next,
					singles: isSingle ? next : {},
				};
			}
		}

		onCleanup(
			history.listen(({ action, location: nextEntry }) => {
				const currentEntry = _entry;
				_entry = nextEntry;

				if (action !== 'update') {
					const pathname = nextEntry.pathname;
					const matched = matchRoute(pathname);

					if (!matched) {
						return;
					}

					const current = state.value;

					let views = current.views;
					let singles = current.singles;
					let isNew = false;

					const prevId = current.active;

					const nextId = matched.id || nextEntry.key;
					const matchedState: MatchedRouteState = {
						...matched,
						id: nextId,
						scrollPos: undefined,
					};

					let nextViews: typeof views | undefined;

					// Recreate the views object to remove no longer reachable views if:
					// - We're pushing a new page, or replacing the current page
					// - We're traversing and the intended index is lower than current
					if (action !== 'traverse' || nextEntry.index < currentEntry.index) {
						const entries = log.entries;

						nextViews = {};

						for (let idx = 0, len = entries.length; idx < len; idx++) {
							const entry = entries[idx];
							const key = entry?.key;

							if (key !== undefined && key in views) {
								nextViews[key] = views[key];
							}
						}
					}

					if (!matched.id) {
						if (!(nextId in views)) {
							if (nextViews) {
								nextViews[nextId] = matchedState;
								isNew = true;
							} else {
								nextViews = { ...views, [nextId]: matchedState };
								isNew = true;
							}
						}
					} else {
						if (!(nextId in singles)) {
							singles = { ...singles, [nextId]: matchedState };
							isNew = true;
						}
					}

					if (nextViews) {
						views = nextViews;
					}

					{
						const prev = current.views[prevId] || current.singles[prevId];
						if (prev) {
							prev.scrollPos = { x: window.scrollX, y: window.scrollY };
						}
					}

					events.emit(prevId, { focus: false, enter: false });

					state.value = { active: nextId, views: views, singles: singles };
					flushSync();

					if (isNew) {
						// Scroll to top if we're pushing or replacing, it's a new page.
						window.scrollTo(0, 0);
					} else {
						{
							const next = views[nextId] || singles[nextId];
							if (next?.scrollPos) {
								const pos = next.scrollPos;
								window.scrollTo(pos.x, pos.y);
							}
						}

						events.emit(nextId, {
							focus: true,
							enter: action !== 'traverse' || nextEntry.index > currentEntry.index,
						});
					}
				}
			}),
		);
	});
};

const matchRoute = (path: string): MatchedRoute | null => {
	for (let idx = 0, len = _routes!.length; idx < len; idx++) {
		const route = _routes![idx];

		const validate = route.validate;
		const pattern = (route._regex ||= buildPathRegex(route.path));

		const match = pattern.exec(path);

		if (!match || (validate && !validate(match.groups!))) {
			continue;
		}

		const params = match.groups!;

		let id: string | undefined;
		if (route.single) {
			id = '@' + idx;
			for (const param in params) {
				id += '/' + params[param];
			}
		}

		return { id: id, def: route, params: params };
	}

	return null;
};

const buildPathRegex = (path: string) => {
	let source =
		'^' +
		path
			.replace(/\/*\*?$/, '')
			.replace(/^\/*/, '/')
			.replace(/[\\.*+^${}|()[\]]/g, '\\$&')
			.replace(/\/:([\w-]+)(\?)?/g, '/$2(?<$1>[^\\/]+)$2');

	source += path.endsWith('*')
		? path === '*' || path === '/*'
			? '(?<$>.*)$'
			: '(?:\\/(?<$>.+)|\\/*)$'
		: '\\/*$';

	return new RegExp(source, 'i');
};
