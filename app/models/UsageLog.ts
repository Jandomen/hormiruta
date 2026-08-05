import mongoose, { Schema, model, models } from 'mongoose';

const UsageLogSchema = new Schema({
    month: {
        type: String,
        required: true,
        unique: true,
    },
    mapLoads: {
        type: Number,
        default: 0,
    },
    directions: {
        type: Number,
        default: 0,
    },
    geocoding: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const UsageLog = models.UsageLog || model('UsageLog', UsageLogSchema);

export default UsageLog;
