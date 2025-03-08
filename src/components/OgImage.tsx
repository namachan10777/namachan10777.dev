import React from 'react';

interface OgImageProps {
  title: string;
  description: string;
  siteName?: string;
  bg_image?: string;
}

export function OgImage({
  title,
  description,
  siteName = 'namachan10777.dev',
  bg_image,
}: OgImageProps) {
  const bgStyle = bg_image
    ? {
        backgroundImage: `url(${bg_image})`,
        backgroundSize: '100% 100%',
      }
    : {};
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        position: 'relative',
        ...bgStyle,
      }}
    >
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(20, 20, 20, 0.6)', padding: '40px',}}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 16,
              lineHeight: 1.2,
              opacity: 1,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.4,
              opacity: 1,
            }}
          >
            {description}
          </div>
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: 24,
              opacity: 1,
            }}
          >
            {siteName}
          </div>
      </div>
    </div>
  );
}
