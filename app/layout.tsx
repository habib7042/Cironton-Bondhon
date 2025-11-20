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
      </head>
      <body>{children}</body>
    </html>
  )
}