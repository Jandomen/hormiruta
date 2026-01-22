import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "./mongodb-adapter";
import dbConnect from "./mongodb";
import User from "../models/User";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                console.log("Authorize called with:", credentials?.email);
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    console.log("Connecting to DB...");
                    await dbConnect();
                    console.log("DB Connected.");

                    const user = await User.findOne({ email: credentials.email });
                    console.log("User found:", user ? "Yes" : "No");
                    if (!user) return null;

                    const isValid = await compare(credentials.password, user.password);
                    console.log("Password valid:", isValid);
                    if (!isValid) return null;

                    return { id: user._id.toString(), email: user.email, name: user.name, image: user.image };
                } catch (error) {
                    console.error("Authorize error:", error);
                    return null;
                }
            }
        }),
        // AppleProvider removed temporarily to simplify config, add back if needed
    ],
    // ... rest of config
    pages: {
        signIn: '/auth/login',
        newUser: '/auth/register',
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            console.log("JWT Callback:", token, user ? "User present" : "No user");
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback:", session.user?.email, token ? "Token present" : "No token");
            if (token && session.user) {
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};
