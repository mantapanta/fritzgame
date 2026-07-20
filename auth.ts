import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import { redis } from "@/lib/redis";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: UpstashRedisAdapter(redis),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      // Ohne verifizierte Domain erlaubt Resend nur Versand von dieser Adresse.
      from: process.env.AUTH_EMAIL_FROM || "onboarding@resend.dev",
    }),
  ],
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?sent=1",
  },
  callbacks: {
    // Bei DB-Sessions die User-ID in die Session spiegeln.
    session({ session, user }) {
      if (session.user && user) session.user.id = user.id;
      return session;
    },
  },
});
