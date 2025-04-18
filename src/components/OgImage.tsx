import React from 'react';

interface OgImageProps {
  title: string;
  description: string;
  siteName?: string;
}

export function OgImage({ title, description, siteName = 'namachan10777.dev' }: OgImageProps) {
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
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
        }}
      >
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
            color: 'rgb(255, 255, 255, 0.8)',
            lineHeight: 1.4,
            opacity: 1,
          }}
        >
          {description}
        </div>
        <div
          style={{
            fontSize: 24,
            color: 'rgb(255, 255, 255, 0.6)',
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
