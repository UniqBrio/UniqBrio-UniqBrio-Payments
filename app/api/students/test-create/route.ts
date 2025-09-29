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
  collection: 'students'
})

const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema)

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    console.log('� Checking existing students in collection (READ-ONLY)')
    
    // Only check existing students - no creation or modification
    const existingStudents = await StudentModel.find({}).limit(10)
    
    console.log(`✅ Found ${existingStudents.length} existing students in collection`)
    
    const results = existingStudents.map(student => ({
      success: true,
      studentId: student.studentId,
      name: student.name,
      communicationPreferences: student.communicationPreferences || {
        enabled: true,
        channels: ["Email"]
      }
    }))

    return NextResponse.json({
      success: true,
      message: `Found ${existingStudents.length} existing students (READ-ONLY)`,
      results: results
    })

  } catch (error) {
    console.error('❌ Error creating test students:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create test students', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}