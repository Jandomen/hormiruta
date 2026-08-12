import mongoose, { Schema, model, models } from 'mongoose';

const FleetSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    memberIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    geofence: {
        enabled: { type: Boolean, default: false },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        radiusKm: { type: Number, default: 5 },
        centerLabel: { type: String, default: '' },
    },
    inviteCode: {
        type: String,
        required: false,
    },
    inviteCodeExpires: {
        type: Date,
        required: false,
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

const Fleet = models.Fleet || model('Fleet', FleetSchema);

export default Fleet;
