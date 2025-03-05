import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import type { CollectionEntry } from 'astro:content';

export async function GET(context: APIContext) {
  // Get all published blog posts
  const posts = await getCollection('post', (post: CollectionEntry<'post'>) => post.data.publish);
  
  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a: CollectionEntry<'post'>, b: CollectionEntry<'post'>) => 
    b.data.date.getTime() - a.data.date.getTime()
  );
  
  // Generate the RSS feed
  return rss({
    // The title of your website
    title: 'namachan10777.dev',
    // A description of your website
    description: 'namachan10777\'s personal website and blog',
    // The site URL (from your astro.config)
    site: context.site!,
    // The list of items in your feed
    items: sortedPosts.map((post: CollectionEntry<'post'>) => ({
      // The title of the post
      title: post.data.title,
      // The description or excerpt of the post
      description: post.data.description,
      // The publication date of the post
      pubDate: post.data.date,
      // The URL of the post
      link: `/post/${post.slug}/`,
      // Optional: categories/tags for the post
      categories: post.data.tags || [],
    })),
    // Optional: customize the XML output
    customData: `<language>ja</language>`,
  });
}
