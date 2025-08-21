#!/bin/bash
# CreatorOS Folder Structure Setup Script
# Run this from inside the creatoros/ folder

echo "Setting up CreatorOS folder structure..."

# Create all the folders from our 8 sprints
mkdir -p app/{api,auth,dashboard,onboarding,pricing,builder,courses,checkout}
mkdir -p app/api/{auth,courses,dev,invites,orgs,sections,stripe,lessons,ai}
mkdir -p app/api/auth/callback
mkdir -p app/api/ai/generate
mkdir -p app/api/dev/seed
mkdir -p app/api/orgs/{orgId}/invites
mkdir -p app/api/invites/{token}/accept
mkdir -p app/api/sections/{sectionId}/lessons
mkdir -p app/api/lessons/{lessonId}/upload
mkdir -p app/api/stripe/{sync,webhook}
mkdir -p app/builder/{siteId}/pages/{new,pageId}
mkdir -p app/courses/{admin,courseId}
mkdir -p app/courses/admin/{courseId}/edit
mkdir -p app/checkout/{success,cancel}

# Create supporting directories
mkdir -p lib
mkdir -p supabase/migrations
mkdir -p tests
mkdir -p docs
mkdir -p public
mkdir -p components
mkdir -p components/ui

echo "✅ Folder structure created successfully!"