import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'

// Students Collection Schema
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
    
  // Console message removed as requested
    
    // Find all students
    const students = await StudentModel.find({}).limit(10).sort({ createdAt: -1 })
    
    // Console message removed as requested
    
    // Log each student's communication preferences
    students.forEach((student, index) => {
      // Console message removed as requested
    })

    return NextResponse.json({
      success: true,
      count: students.length,
      students: students.map(student => ({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        communicationPreferences: student.communicationPreferences || {
          enabled: true,
          channels: ["Email"]
        }
      })),
      message: `Found ${students.length} students with communication preferences`
    })

  } catch (error) {
    // Console message removed
    return NextResponse.json(
      { 
        error: 'Failed to fetch students', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}