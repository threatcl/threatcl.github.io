import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://threatcl.github.io',
  base: '/docs',
	integrations: [
		starlight({
			title: 'threatcl docs',
			social: {
				github: 'https://github.com/threatcl/threatcl',
			},
			sidebar: [
				{
					label: 'Threatcl command',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Overview', link: '/threatcl/overview/' },
						{ label: 'Installation', link: '/threatcl/installation/' },
						{ label: 'Usage', link: '/threatcl/usage/' },
					],
				},
				{
					label: 'Threatcl specification',
					autogenerate: { directory: 'specification' },
				},
			],
		}),
	],
});
