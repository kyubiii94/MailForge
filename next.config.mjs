/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Réduit le tree-shaking des barrels lucide → chunks client plus petits
    optimizePackageImports: ['lucide-react'],
    // Évite d'embarquer ces libs lourdes dans les bundles serverless
    serverComponentsExternalPackages: ['bcryptjs', '@google/genai', '@neondatabase/serverless'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
