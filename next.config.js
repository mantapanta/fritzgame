/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Uploads sind Base64-Bilder – erlaube größere Request-Bodies für die Server Actions/Routen.
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

module.exports = nextConfig;
