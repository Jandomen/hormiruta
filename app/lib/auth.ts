import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/app/lib/mongodb-adapter";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                console.log("[AUTH] Authorize called for:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    console.log("[AUTH] Missing credentials");
                    return null;
                }

                try {
                    console.log("[AUTH] Initiating DB connection...");
                    await dbConnect();
                    console.log("[AUTH] DB connection established");

                    console.log("[AUTH] Searching for user...");
                    const user = await User.findOne({ email: credentials.email });
                    console.log("[AUTH] User search completed. Found:", user ? "YES" : "NO");

                    if (!user) {
                        console.log("[AUTH] User not found in database");
                        return null;
                    }

                    console.log("[AUTH] Comparing passwords...");
                    const isValid = await compare(credentials.password, user.password);
                    console.log("[AUTH] Password validation result:", isValid);

                    if (!isValid) {
                        console.log("[AUTH] Invalid password provided");
                        return null;
                    }

                    console.log("[AUTH] Authorization successful for:", user.email);
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        sosContact: user.sosContact,
                        role: user.role || 'user'
                    };
                } catch (error) {
                    console.error("[AUTH] Authorize error exception:", error);
                    return null;
                }
            }
        }),
    ],
    // ... rest of config
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });

                    // Si el usuario ya existe, NextAuth vinculará la cuenta gracias a allowDangerousEmailAccountLinking
                    // Simplemente nos aseguramos de que la conexión a la DB esté lista.
                    return true;
                } catch (error) {
                    console.error("[AUTH] Error in signIn callback:", error);
                    return true; // Permitimos el paso, NextAuth manejará lo demás
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            console.log("JWT Callback:", token, user ? "User present" : "No user");
            if (user) {
                token.id = user.id;
                token.sosContact = (user as any).sosContact;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback:", session.user?.email, token ? "Token present" : "No token");
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).sosContact = token.sosContact;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    debug: true,
};
