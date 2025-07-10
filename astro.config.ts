// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkDendenRuby from 'remark-denden-ruby';
import rehypeSectionize from '@hbsnow/rehype-sectionize';

import mdx from '@astrojs/mdx';

import icon from 'astro-icon';
import remarkGemoji from 'remark-gemoji';
import rehypeSlug from 'rehype-slug';

import { parse } from 'svg-parser';
import { visit, SKIP } from 'unist-util-visit';
import type * as hast from 'hast';
import type * as mdast from 'mdast';

const iconoirLinkIcon =
  '<svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 11.9976C14 9.5059 11.683 7 8.85714 7C8.52241 7 7.41904 7.00001 7.14286 7.00001C4.30254 7.00001 2 9.23752 2 11.9976C2 14.376 3.70973 16.3664 6 16.8714C6.36756 16.9525 6.75006 16.9952 7.14286 16.9952" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 11.9976C10 14.4893 12.317 16.9952 15.1429 16.9952C15.4776 16.9952 16.581 16.9952 16.8571 16.9952C19.6975 16.9952 22 14.7577 22 11.9976C22 9.6192 20.2903 7.62884 18 7.12383C17.6324 7.04278 17.2499 6.99999 16.8571 6.99999" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

const linkIcon = parse(iconoirLinkIcon).children[0] as hast.ElementContent;

function rehypeAutoLinkHeadings() {
  return (tree: hast.Root) => {
    visit(tree, 'element', node => {
      if (
        ['h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tagName) &&
        !(node.properties.class && node.properties.class === 'heading')
      ) {
        if ('id' in node.properties && typeof node.properties.id === 'string') {
          const heading = {
            ...node,
            properties: {
              class: 'heading',
            },
          };
          const link: hast.Element = {
            type: 'element',
            tagName: 'a',
            properties: {
              href: `#${node.properties.id}`,
              class: 'heading-anchor',
            },
            children: [linkIcon],
            position: node.position,
          };
          node.tagName = 'div';
          node.properties.class = 'heading-container';
          node.children = [heading, link];
        }
      }
    });
  };
}

function rehypeFigure() {
  return (node: hast.Root) => {
    visit(node, 'element', node => {
      if (node.tagName === 'img') {
        const img = {
          ...node,
        };
        const title =
          'title' in img.properties && typeof img.properties.title === 'string'
            ? img.properties.title
            : (img.properties.alt as string);
        node.tagName = 'figure';
        node.properties = {};
        node.children = [
          img,
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [
              {
                type: 'text',
                value: title,
              },
            ],
          },
        ];
        return SKIP;
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), icon()],
  markdown: {
    remarkPlugins: [remarkMath, remarkGemoji, remarkDendenRuby],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      rehypeSectionize,
      rehypeAutoLinkHeadings,
      rehypeFigure,
    ],
    shikiConfig: {
      theme: 'css-variables',
    },
  },
});
