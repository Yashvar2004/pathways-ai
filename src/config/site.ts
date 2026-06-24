import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export const siteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  links: {
    login: "/login",
    signup: "/signup",
    dashboard: "/dashboard",
    pricing: "/pricing",
  },
};

export type SiteConfig = typeof siteConfig;
