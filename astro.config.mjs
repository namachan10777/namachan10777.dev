// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.namachan10777.dev',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			// Choose a light theme as default
			theme: 'github-light',
			// Enable theme switching based on user's color scheme preference
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			// Enable wrap to prevent horizontal scrolling
			wrap: true,
			// Make background transparent to allow CSS background to show through
			transformers: [{
				pre(node) {
					// Remove background-color from pre element
					if (node.properties.style && typeof node.properties.style === 'string') {
						node.properties.style = node.properties.style.replace(/background-color:[^;]+;/, '');
					}
					return node;
				},
				code(node) {
					// Remove background-color from code element
					if (node.properties.style && typeof node.properties.style === 'string') {
						node.properties.style = node.properties.style.replace(/background-color:[^;]+;/, '');
					}
					
					// Add shiki class to code element
					const classes = node.properties.class || '';
					if (typeof classes === 'string' && !classes.includes('shiki')) {
						node.properties.class = `${classes} shiki`.trim();
					} else {
						node.properties.class = 'shiki';
					}
					
					return node;
				}
			}]
		},
	},
});
