import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserByCode } from "@/lib/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Zugangscode",
      credentials: { code: { label: "Code", type: "text" } },
      async authorize(creds) {
        const user = await getUserByCode(String(creds?.code || ""));
        if (!user) return null;
        return { id: user.code, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = (user as { id: string }).id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = String(token.id);
      return session;
    },
  },
});
