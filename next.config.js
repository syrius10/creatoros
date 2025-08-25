/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone output for optimal performance
  output: 'standalone',
  
  // Ensure proper static asset handling
  images: {
    unoptimized: true
  },
  
  // Transpile necessary packages
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
}

module.exports = nextConfig  // ← Make sure it says "nextConfig" NOT "nextConfigver"