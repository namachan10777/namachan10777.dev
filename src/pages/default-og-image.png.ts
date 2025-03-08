import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import { OgImage } from '../components/OgImage';

export const GET: APIRoute = async () => {
  try {
    // デフォルトのOGP画像を生成
    return new ImageResponse(
      OgImage({
        title: 'namachan10777.dev',
        description: "namachan10777's personal website",
      }),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    return new Response(`Error generating default OG image: ${error}`, { status: 500 });
  }
};
