import mongoose, { Schema, model, models } from 'mongoose';

const ExpenseSchema = new Schema({
    routeId: {
        type: String,
        required: true,
    },
    driverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['FUEL', 'TOLL', 'MAINTENANCE', 'OTHER'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const Expense = models.Expense || model('Expense', ExpenseSchema);

export default Expense;
