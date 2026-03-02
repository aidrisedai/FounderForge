import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.id = profile.sub;
        
        // Create or update user in database
        try {
          await prisma.user.upsert({
            where: { email: profile.email },
            update: {
              name: profile.name,
              image: profile.picture,
            },
            create: {
              email: profile.email,
              name: profile.name,
              image: profile.picture,
            },
          });
        } catch (error) {
          console.error("Error upserting user:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
          });
          if (dbUser) {
            session.user.id = dbUser.id;
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          session.user.id = token.id || token.sub;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
