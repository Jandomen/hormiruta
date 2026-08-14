import mongoose, { Schema, model, models } from 'mongoose';

const PlanSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'MXN' },
    trialDays: { type: Number, default: 0 },
    // > 0 = plan flex de pago único (expiración = now + durationDays días).
    // 0 o ausente = suscripción mensual recurrente (como jandosoft).
    durationDays: { type: Number, default: 0 },
    stripePriceId: { type: String, default: '' },
    // Qué desbloquea el plan. true = da acceso a esas funciones (se usa en los gates).
    grantsPro: { type: Boolean, default: false },
    grantsFleet: { type: Boolean, default: false },
    description: { type: String, default: '' },
    features: [{ type: String }],
    highlight: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    color: { type: String, default: 'from-blue-400 to-indigo-500' },
    cta: { type: String, default: '' },
    ctaLink: { type: String, default: '' },
    serviceTime: { type: Number, default: 5 },
});

const PricingSchema = new Schema({
    plans: [PlanSchema],
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true, strict: false });

const Pricing = models.Pricing || model('Pricing', PricingSchema);

export default Pricing;
