import { mount } from 'svelte';

import { configureRouter } from '../lib/index.js';
import { appHistory, logger } from './globals/navigation.js';

import App from './App.svelte';

import Counter from './views/counter.svelte';
import Home from './views/home.svelte';

configureRouter({
	history: appHistory,
	logger: logger,
	routes: [
		{
			path: '/',
			component: Home,
		},
		{
			path: '/counter',
			component: Counter,
		},
	],
});

mount(App, {
	target: document.getElementById('app')!,
});
