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
    
    console.log('🔍 Fetching all students from students collection')
    
    // Find all students
    const students = await StudentModel.find({}).limit(10).sort({ createdAt: -1 })
    
    console.log(`✅ Found ${students.length} students in collection`)
    
    // Log each student's communication preferences
    students.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, {
        studentId: student.studentId,
        name: student.name,
        communicationPreferences: student.communicationPreferences
      })
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
    console.error('❌ Error fetching students:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch students', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}