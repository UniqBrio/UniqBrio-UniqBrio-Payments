import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'

// Students Collection Schema (for communication preferences)
const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  whatsapp: { type: String },
  communicationPreferences: {
    enabled: { type: Boolean, default: true },
    channels: {
      type: [String],
      enum: ["Email", "SMS", "WhatsApp", "In App", "Push Notification"],
      default: ["Email"]
    }
  }
}, { 
  timestamps: true,
  collection: 'students' // Specify the actual collection name
})

// Create or get existing model
const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema)

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

  // Console message removed as requested
    
    // Find student in students collection
    const student = await StudentModel.findOne({ studentId: studentId })
    
    if (!student) {
  // Console message removed as requested
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Console message removed as requested

    // Return communication preferences
    const communicationPreferences = student.communicationPreferences || {
      enabled: true,
      channels: ["Email"]
    }

    return NextResponse.json({
      success: true,
      studentId: student.studentId,
      name: student.name,
      communicationPreferences: communicationPreferences,
      message: `Communication preferences retrieved for ${student.name}`
    })

  } catch (error) {
    // Console message removed
    return NextResponse.json(
      { 
        error: 'Communication preferences unavailable', 
        message: 'Service temporarily unavailable' 
      },
      { status: 500 }
    )
  }
}

// POST method removed - only GET operations allowed