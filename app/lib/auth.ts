import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/app/lib/mongodb-adapter";
import dbConnect from "@/app/lib/mongodb";
import User from "@/app/models/User";
import { compare } from "bcryptjs";
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


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
                googleIdToken: { label: "Google ID Token", type: "text" }
            },
            async authorize(credentials) {
                // 1. Native Google Auth Flow (Android/iOS)
                if (credentials?.googleIdToken) {
                    try {
                        const ticket = await googleClient.verifyIdToken({
                            idToken: credentials.googleIdToken,
                            audience: [
                                process.env.GOOGLE_CLIENT_ID || "",
                                '440686775268-11p4igopbout2f5jqkor8d0jjhgjp8er.apps.googleusercontent.com'
                            ]
                        });
                        const payload = ticket.getPayload();
                        if (!payload?.email) return null;

                        await dbConnect();
                        let user = await User.findOne({ email: payload.email });

                        // If user doesn't exist, create it (Just-In-Time provisioning)
                        if (!user) {
                            user = await User.create({
                                email: payload.email,
                                name: payload.name || payload.email.split('@')[0],
                                image: payload.picture,
                                provider: 'google',
                                password: 'GOOGLE_AUTH_NATIVE_' + Math.random().toString(36),
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
                            plan: user.plan || 'free'
                        };

                    } catch (error) {
                        console.error("[AUTH] Google Native Verification Failed:", error);
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
                        plan: user.plan || 'free'
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.sosContact = (user as any).sosContact;
                token.role = (user as any).role;
                token.plan = (user as any).plan;
                token.subscriptionStatus = (user as any).subscriptionStatus;
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
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    debug: true,
};
