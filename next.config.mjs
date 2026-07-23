/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Réduit le tree-shaking de lucide / dnd-kit (barrels) → chunks client plus petits
    optimizePackageImports: ['lucide-react', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
    // Évite d'embarquer ces libs lourdes dans les bundles serverless
    serverComponentsExternalPackages: [
      'mjml',
      'cheerio',
      'openai',
      'bcryptjs',
      '@google/genai',
      '@neondatabase/serverless',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
