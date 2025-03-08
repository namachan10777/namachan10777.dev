import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { ImageResponse } from '@vercel/og';
import { OgImage } from '../../components/OgImage';
import type { ImageMetadata } from 'astro';
import sharp from 'sharp';

async function loadOgpImage(image: ImageMetadata): Promise<Buffer | undefined> {
  const path = /([^?]+)(\?.+)?$/.exec(
    image.src.startsWith('/@fs/') ? image.src.slice(4) : `dist${image.src}`
  )?.[1];
  if (path) {
    const image = sharp(path);
    return await image.resize({ width: 1200, height: 630, fit: 'cover' }).png().toBuffer();
  }
}

export const GET: APIRoute = async ({ params }) => {
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

    if (entry.data.og_image) {
      const image = await loadOgpImage(entry.data.og_image);
      return new Response(image, {
        headers: {
          'Content-Type': 'image/png',
        },
      });
    } else {
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
    }
  } catch (error) {
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
