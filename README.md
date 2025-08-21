CreatorOS 🚀
The All-in-One Platform for Creators - A Kajabi/Systeme.io-style platform built with modern web technologies, featuring mobile apps, AI assistance, and seamless payment integration.

🌟 Features
🎓 Course Creation: Build and sell courses with video lessons, quizzes, and progress tracking

🌐 Site Builder: Drag-and-drop page builder with custom domains

🤖 AI Assistant: AI-powered content generation for courses, landing pages, and email sequences

📱 Mobile Apps: Native iOS and Android apps for learning on the go

💳 Payments: Stripe integration with one-time and subscription pricing

👥 Multi-tenant: Organizations and team management with role-based access

🔒 Secure: Row-Level Security (RLS) and secure file storage

🛠️ Tech Stack
Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS

Backend: Next.js API Routes, Supabase (Postgres, Auth, Storage)

Mobile: Expo (React Native), EAS Build

Payments: Stripe Checkout & Webhooks

Email: Resend

AI: Pluggable AI providers (OpenAI, Anthropic, or custom)

Deployment: Vercel, Supabase

Testing: Playwright (E2E)

🚀 Quick Start
bash
# Clone and setup
git clone https://github.com/your-username/creatoros.git
cd creatoros
npm install

# Setup environment
cp .env.example .env.local
# Add your Supabase keys

# Setup database
supabase db push

# Start development
npm run dev
📋 Prerequisites
Node.js 18+

Supabase account

Stripe account

Expo account

Vercel account (for deployment)

📁 Project Structure
text
creatoros/
├── app/                 # Next.js App Router pages and API routes
├── lib/                 # Utilities, Supabase clients, AI orchestrator
├── supabase/
│   └── migrations/      # Database migrations with RLS policies
├── mobile/              # Expo React Native app
├── tests/               # Playwright E2E tests
└── docs/                # Deployment and setup guides
🎯 Sprints Completed
Foundation: Next.js + Supabase + Authentication

Organizations: Multi-tenant setup with invites and roles

Billing: Stripe integration with products and webhooks

Site Builder: Drag-and-drop page builder

Courses: Course management with video uploads

AI Assistant: AI content generation

Mobile Apps: Expo apps with deep linking

Production: Deployment and store submission

📱 Mobile Apps
Native mobile apps built with Expo that provide:

Course browsing and enrollment

Video lesson playback

Progress tracking

Deep links to web checkout

OTA updates via EAS

🔐 Security Features
Row-Level Security (RLS) on all database tables

Secure file access via signed URLs

Rate limiting on API endpoints

Proper CORS configuration

Environment variable validation

🚀 Deployment
Deploy with a single command:

bash
vercel --prod
Includes:

✅ Automatic database migrations

✅ Environment variable validation

✅ Build optimization

✅ CDN for static assets

📊 Monitoring & Analytics
Vercel Analytics for web traffic

Built-in logging system

Error tracking ready (Sentry compatible)

Performance monitoring

🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🆘 Support
Documentation

Troubleshooting Guide

Discussions

Issues

🌟 Star History
https://api.star-history.com/svg?repos=your-username/creatoros&type=Date

CreatorOS - Empower creators to build, sell, and grow their digital products with a complete platform that just works. 💪

Built with ❤️ using Next.js, Supabase, and Expo.
