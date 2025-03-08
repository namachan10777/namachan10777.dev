import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { ImageResponse } from '@vercel/og';
import { OgImage } from '../../components/OgImage';

export const GET: APIRoute = async ({ params, request }) => {
  // slugからコンテンツを取得
  const slug = params.slug;
  if (!slug) {
    return new Response('Slug is required', { status: 400 });
  }

  try {
    // コンテンツエントリを取得
    const entry = await getEntry('post', slug);
    if (!entry) {
      return new Response('Post not found', { status: 404 });
    }

    // OGP画像を生成
    return new ImageResponse(
      OgImage({
        title: entry.data.title,
        description: entry.data.description,
      }),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error(`Error generating OG image: ${error}`);
    return new Response(`Error generating OG image: ${error}`, { status: 500 });
  }
};

// 静的生成のためのパスを取得
export async function getStaticPaths() {
  const posts = await getCollection('post', post => post.data.publish);
  
  return posts.map(post => ({
    params: { slug: post.slug },
  }));
}
