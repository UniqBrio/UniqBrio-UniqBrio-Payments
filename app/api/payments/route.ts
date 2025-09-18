import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Payment Schema
const PaymentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  mode: { type: String, enum: ["Cash", "UPI", "Card", "QR"], required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema, "payments");

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const payment = new Payment({
      studentId: body.studentId,
      amount: body.amount,
      date: new Date(body.date),
      mode: body.mode,
      notes: body.notes
    });

    await payment.save();

    return NextResponse.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create payment" },
      { status: 500 }
    );
  }
}