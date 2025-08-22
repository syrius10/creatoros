/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the experimental object entirely or update it:
  serverExternalPackages: ['@supabase/supabase-js'],
}

module.exports = nextConfig