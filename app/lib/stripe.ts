import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is missing');
}

export const stripe = new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
});
