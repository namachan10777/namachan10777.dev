// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

function parseMetaAttributes(meta: string | undefined): Record<string, string | boolean> {
	if (!meta) return {};
	let entries = meta.split(/\s+/).map((attr) => {
		if (attr.includes('=')) {
			const separatorPos = attr.indexOf('=');
			return [attr.slice(0, separatorPos), attr.slice(separatorPos + 1)];
		}
		else {
			return [attr, true];
		}
	});
	return Object.fromEntries(entries);
}

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
					
					// Parse meta data from raw meta string
					const metaAttributes = parseMetaAttributes(this.options.meta?.__raw);
					
					// Check if showLineNumbers is present
					if (metaAttributes.showLineNumbers) {
						node.properties['data-line-numbers'] = 'true';
					}
					
					return node;
				},
			}]
		},
	},
});
