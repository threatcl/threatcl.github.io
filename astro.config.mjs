import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://threatcl.github.io',
	integrations: [
		starlight({
			title: 'threatcl',
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
					// autogenerate: { directory: 'specification' },
          items: [
            { label: 'Syntax Overview', link: '/specification/overview/' },
            { label: 'Threatmodel Block', link: '/specification/threatmodel/' },
            { label: 'External HCL Files', link: '/specification/external-files/' },
            { label: 'Example Threat Model', link: '/specification/example/' },
            { label: "Full Spec", link :'/specification/full-spec/' },
          ],
				},
        {
          label: 'Threatcl in CI/CD',
          items: [
            { label: 'CI/CD Overview', link: '/cicd/overview/' },
            { label: 'GitHub Actions', link: '/cicd/github/' },
          ],
        },
			],
		}),
	],
});
