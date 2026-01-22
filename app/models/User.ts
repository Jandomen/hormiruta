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
        required: false, // Optional for Google/Apple login
    },
    image: {
        type: String,
        required: false,
    },
    subscriptionStatus: {
        type: String,
        enum: ['FREE', 'PRO'],
        default: 'FREE',
    },
    sosContact: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = models.User || model('User', UserSchema);

export default User;
