import React from 'react';
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'চিরন্তন বন্ধন',
  description: 'Community savings app for friends.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('Service Worker registration successful');
                      },
                      function(err) {
                        console.log('Service Worker registration failed: ', err);
                      }
                    );
                  });
                }
              `,
            }}
          />
      </head>
      <body>{children}</body>
    </html>
  )
}