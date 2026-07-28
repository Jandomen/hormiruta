import mongoose, { Schema, Document } from 'mongoose';

export interface ISOSAlert extends Document {
    userId: mongoose.Types.ObjectId;
    driverName: string;
    email: string;
    location: string;
    message: string;
    contact: string;
    status: 'sent' | 'failed';
    createdAt: Date;
}

const SOSAlertSchema = new Schema<ISOSAlert>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        driverName: { type: String, required: true },
        email: { type: String, required: true },
        location: { type: String, default: '' },
        message: { type: String, default: '' },
        contact: { type: String, default: '' },
        status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
    },
    { timestamps: true }
);

export default mongoose.models.SOSAlert || mongoose.model<ISOSAlert>('SOSAlert', SOSAlertSchema);
