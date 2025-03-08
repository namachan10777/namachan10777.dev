import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { ImageResponse } from '@vercel/og';
import { OgImage } from '../../components/OgImage';
import imageType from 'image-type';
import type { ImageMetadata } from 'astro';

function uint8ArrayToDataUrl(uint8Array: Uint8Array, mimeType = 'image/png') {
  // Uint8Array を Buffer に変換
  const buffer = Buffer.from(uint8Array);

  // Base64 エンコード
  const base64String = buffer.toString('base64');

  // Data URL 形式に変換
  return `data:${mimeType};base64,${base64String}`;
}

async function toDataUrl(image: ImageMetadata): Promise<string | undefined> {
  const path = /([^?]+)(\?.+)?$/.exec(
    image.src.startsWith('/@fs/') ? image.src.slice(4) : `dist${image.src}`
  )?.[1];
  if (path) {
    const file = await Bun.file(path).bytes();
    const type = await imageType(file);
    return uint8ArrayToDataUrl(file, type?.mime || 'image/png');
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

    const bg_image = entry.data.og_image && (await toDataUrl(entry.data.og_image));

    // OGP画像を生成
    return new ImageResponse(
      OgImage({
        title: entry.data.title,
        description: entry.data.description,
        bg_image,
      }),
      {
        width: 1200,
        height: 630,
      }
    );
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
