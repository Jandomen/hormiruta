import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/app/lib/mongodb-adapter";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { compare } from "bcryptjs";


import { initFirebaseAdmin } from "@/app/lib/firebase-admin";

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            httpOptions: {
                timeout: 10000,
            },
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                googleIdToken: { label: "Google ID Token", type: "text" },
            },
            async authorize(credentials) {
                // 1. Native Mobile Google Sign-In Flow
                if (credentials?.googleIdToken) {
                    try {
                        const admin = initFirebaseAdmin();
                        const decodedToken = await admin.auth().verifyIdToken(credentials.googleIdToken);
                        const { email, name, picture, uid } = decodedToken;

                        if (!email) return null;

                        await dbConnect();

                        // Find or create user
                        let user = await User.findOne({ email });

                        if (!user) {
                            // Create new user from Google profile
                            user = await User.create({
                                email,
                                name: name || email.split('@')[0],
                                image: picture,
                                password: `google_${uid}_${Date.now()}`, // Dummy password for oauth users
                                role: 'user',
                                provider: 'google',
                                subscriptionStatus: 'none',
                                plan: 'free'
                            });
                        }

                        return {
                            id: user._id.toString(),
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            sosContact: user.sosContact,
                            role: user.role || 'user',
                            subscriptionStatus: user.subscriptionStatus || 'none',
                            plan: user.plan || 'free',
                            preferredMapApp: user.preferredMapApp,
                            vehicleType: user.vehicleType
                        };

                    } catch (error) {
                        console.error("[AUTH] Google Token Verification Error:", error);
                        return null;
                    }
                }

                // 2. Standard Email/Password Flow
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    await dbConnect();
                    const user = await User.findOne({ email: credentials.email });

                    if (!user) {
                        return null;
                    }

                    const isValid = await compare(credentials.password, user.password);

                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        sosContact: user.sosContact,
                        role: user.role || 'user',
                        subscriptionStatus: user.subscriptionStatus || 'none',
                        plan: user.plan || 'free',
                        preferredMapApp: user.preferredMapApp,
                        vehicleType: user.vehicleType
                    };
                } catch (error) {
                    console.error("[AUTH] Authorize error:", error);
                    return null;
                }
            }
        }),
    ],
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });
                    return true;
                } catch (error) {
                    console.error("[AUTH] Error in signIn callback:", error);
                    return true;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.sosContact = (user as any).sosContact;
                token.role = (user as any).role;
                token.plan = (user as any).plan;
                token.subscriptionStatus = (user as any).subscriptionStatus;
                token.preferredMapApp = (user as any).preferredMapApp;
                token.vehicleType = (user as any).vehicleType;
            }

            // Handle session update
            if (trigger === "update" && session) {
                if (session.sosContact !== undefined) token.sosContact = session.sosContact;
                if (session.role !== undefined) token.role = session.role;
                if (session.plan !== undefined) token.plan = session.plan;
                if (session.subscriptionStatus !== undefined) token.subscriptionStatus = session.subscriptionStatus;
                if (session.preferredMapApp !== undefined) token.preferredMapApp = session.preferredMapApp;
                if (session.vehicleType !== undefined) token.vehicleType = session.vehicleType;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).sosContact = token.sosContact;
                (session.user as any).role = token.role;
                (session.user as any).plan = token.plan;
                (session.user as any).subscriptionStatus = token.subscriptionStatus;
                (session.user as any).preferredMapApp = token.preferredMapApp;
                (session.user as any).vehicleType = token.vehicleType;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    debug: true,
};
