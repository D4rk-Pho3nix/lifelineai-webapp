import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        countryCode: { label: "Country Code", type: "text", placeholder: "+91" },
        phone: { label: "Phone", type: "text", placeholder: "78288088356" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Add your own logic here to retrieve a user from a database
        // and verify their credentials.
        // For now, we'll return a dummy user.
        if (
          credentials?.phone === "9487814500" &&
          credentials?.countryCode === "+91" &&
          credentials?.password === "@kamalaniketan"
        ) {
          return { 
            id: "1", 
            name: "Manish Kumar S", 
            email: "manish.srmist23@gmail.com",
            phone: credentials.phone,
            countryCode: credentials.countryCode
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login", // Custom login page
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = (user as any).phone
        token.countryCode = (user as any).countryCode
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).phone = token.phone as string
        ;(session.user as any).countryCode = token.countryCode as string
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
