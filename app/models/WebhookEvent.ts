import mongoose, { Schema, model, models } from 'mongoose';

const WebhookEventSchema = new Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const WebhookEvent = models.WebhookEvent || model('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
