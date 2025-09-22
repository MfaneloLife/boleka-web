import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      profileCompleted?: boolean;
      hasBusinessProfile?: boolean;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    profileCompleted?: boolean;
    hasBusinessProfile?: boolean;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    profileCompleted?: boolean;
    hasBusinessProfile?: boolean;
    role?: string;
  }
}
