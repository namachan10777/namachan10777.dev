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

import { visit, SKIP } from 'unist-util-visit';
import type * as hast from 'hast';

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

function rehypeShikiDecorate() {
  return (root: hast.Root) => {
    visit(root, 'element', pre => {
      if (pre.tagName === 'pre') {
        const code = pre.children.find(
          child => child.type === 'element' && child.tagName === 'code'
        ) as hast.Element;
        if (code) {
          const lineCount = code.children.filter(
            child => child.type === 'element' && child.tagName == 'span'
          ).length;
          pre.properties['data-line-count'] = lineCount;
        }
      }
    });
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), icon()],
  site: 'https://www.namachan10777.dev',
  markdown: {
    remarkPlugins: [remarkMath, remarkGemoji, remarkDendenRuby],
    rehypePlugins: [rehypeKatex, rehypeSlug, rehypeSectionize, rehypeFigure, rehypeShikiDecorate],
    shikiConfig: {
      theme: 'css-variables',
    },
  },
});
