import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  mode: { type: String, enum: ["Cash", "UPI", "Card", "QR"], required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema, "payments");