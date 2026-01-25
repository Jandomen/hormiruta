import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    name: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },

    sosContact: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'none'],
        default: 'none',
    },
    plan: {
        type: String,
        enum: ['free', 'premium', 'fleet'],
        default: 'free',
    },
    revenueCatId: {
        type: String,
        required: false,
    },
    lastLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date
    },
    vehicleType: {
        type: String,
        enum: ['car', 'truck', 'van', 'motorcycle', 'pickup', 'ufo'],
        default: 'truck'
    },
    preferredMapApp: {
        type: String,
        enum: ['google', 'waze'],
        required: false
    }
});

const User = models.User || model('User', UserSchema);

export default User;
