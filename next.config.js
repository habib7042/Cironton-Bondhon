/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Ensure DATABASE_URL is available (though usually read from .env.local)
  }
}

module.exports = nextConfig;