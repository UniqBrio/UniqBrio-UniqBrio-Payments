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

    console.log('🔍 Fetching communication preferences for student:', studentId)
    
    // Find student in students collection
    const student = await StudentModel.findOne({ studentId: studentId })
    
    if (!student) {
      console.log('❌ Student not found in students collection:', studentId)
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found student:', {
      studentId: student.studentId,
      name: student.name,
      communicationPreferences: student.communicationPreferences
    })

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
    console.error('❌ Error fetching student communication preferences:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch communication preferences', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST method removed - only GET operations allowed