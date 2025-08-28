# Troubleshooting Guide

## Common Issues and Solutions

### SSR-Specific Issues
**Problem**: Hydration mismatch errors
**Solution**: 
- Use `useEffect` for client-side only logic
- Implement dynamic imports with `ssr: false`
- Check for browser-specific APIs in server components

**Problem**: Environment variables not available in SSR
**Solution**:
- Prefix client-side variables with `NEXT_PUBLIC_`
- Use `process.env` for server-side only
- Restart dev server after env changes

### Authentication Issues
**Problem**: Users can't sign in/sessions not persisting
**Solution**: 
- Check redirect URLs in Supabase dashboard
- Verify cookie domain settings
- Check if `NEXTAUTH_URL` is set correctly

### RLS Policy Violations
**Problem**: "RLS policy violated" errors
**Solution**:
- Check user's organization membership
- Verify RLS policies allow the operation
- Use service role for server-side operations when appropriate

### Mobile App Issues
**Problem**: Deep links not working with SSR
**Solution**:
- Configure app scheme in app.json
- Set up Universal Links (iOS) and App Links (Android)
- Test deep link handling with both web and mobile

### Build Failures
**Problem**: EAS build fails with SSR dependencies
**Solution**:
- Use `react-native` compatible packages
- Avoid server-only modules in mobile code
- Implement platform-specific imports

## Getting Help
- Check Supabase logs in dashboard
- Use Vercel's function logs for SSR issues
- Check browser console for client-side errors
- Use Expo's debugging tools for mobile issues