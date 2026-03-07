/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mjml'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
