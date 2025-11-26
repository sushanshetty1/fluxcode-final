/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "~/server/db";
import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      linkedinUsername?: string | null;
      leetcodeUsername?: string | null;
      onboardingCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    linkedinUsername?: string | null;
    leetcodeUsername?: string | null;
    onboardingCompleted?: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID ?? "",
      clientSecret: env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    session: ({ session, user }: any) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        linkedinUsername: user.linkedinUsername,
        leetcodeUsername: user.leetcodeUsername,
        onboardingCompleted: user.onboardingCompleted,
      },
    }),
    signIn: async ({ user }: any) => {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
      });
      
      if (dbUser && !dbUser.onboardingCompleted) {
        return `/onboarding?userId=${user.id}`;
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
