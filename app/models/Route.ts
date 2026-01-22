import mongoose, { Schema, model, models } from 'mongoose';

const StopSchema = new Schema({
    id: { type: String, required: true },
    address: { type: String, required: true },
    customerName: { type: String, default: '' },
    priority: { type: String, enum: ['HIGH', 'NORMAL'], default: 'NORMAL' },
    timeWindow: { type: String, default: '' },
    notes: { type: String, default: '' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false },
    order: { type: Number, required: true }
});

const RouteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    stops: [StopSchema],
    isOptimized: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'active', 'completed'], default: 'active' },
    totalDistance: { type: Number, default: 0 },
    totalTime: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
RouteSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Route = models.Route || model('Route', RouteSchema);

export default Route;
