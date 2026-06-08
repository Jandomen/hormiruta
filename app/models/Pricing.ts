import mongoose, { Schema, model, models } from 'mongoose';

const PricingSchema = new Schema({
    premium: {
        price: { type: Number, default: 199 },
        currency: { type: String, default: 'USD' },
        trialDays: { type: Number, default: 7 },
    },
    fleet: {
        price: { type: Number, default: 899 },
        currency: { type: String, default: 'USD' },
        trialDays: { type: Number, default: 0 },
    },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Pricing = models.Pricing || model('Pricing', PricingSchema);

export default Pricing;
