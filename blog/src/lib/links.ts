// The blog and the app are deployed as separate Vercel projects.
// Set NEXT_PUBLIC_APP_URL in the blog's Vercel project to the app's production URL.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
export const COMPARE_URL = `${APP_URL}/compare`;
