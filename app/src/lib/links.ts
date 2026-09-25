// The blog and the app are deployed as separate Vercel projects.
// Set NEXT_PUBLIC_BLOG_URL in the app's Vercel project to the blog's production URL.
export const BLOG_URL = (process.env.NEXT_PUBLIC_BLOG_URL ?? "http://localhost:3000").replace(/\/$/, "");
