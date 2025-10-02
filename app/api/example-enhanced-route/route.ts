// Example: Enhanced API Route with Improved Database Connection Pattern
// This demonstrates both the direct approach and middleware approach

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getConnectionHealth } from '@/lib/db';
import Student from '@/models/student';

/**
 * APPROACH 1: Direct Connection (Current Pattern - Already Good)
 * This is what your existing routes use and it's correct
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ CORRECT: Single connection establishment per invocation
    // This reuses cached connection on subsequent API calls
    await dbConnect();
    
    // Optional: Log connection health for debugging
    if (process.env.NODE_ENV === 'development') {
      const health = getConnectionHealth();
      console.log(`🔍 Connection Status: ${health.status} (${health.readyStateNames[health.readyState]})`);
    }
    
    // ✅ CORRECT: Use models normally - connection is cached globally
    const students = await Student.find({}).limit(10);
    
    return NextResponse.json({
      success: true,
      data: students,
      meta: {
        count: students.length,
        connectionReused: true // Connection was reused from cache
      }
    });
    
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
    
    // ✅ CORRECT: Graceful degradation for network issues
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return NextResponse.json({
        success: false,
        data: [],
        fallback: true,
        message: 'Database temporarily unavailable'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * APPROACH 2: Direct Pattern (Same as GET but for POST)
 * This follows the same pattern as your working API routes
 */
export async function POST(request: NextRequest) {
  try {
    // Establish connection (reuses cached connection)
    await dbConnect();
    
    const data = await request.json();
    const student = await Student.create(data);
    
    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('❌ POST operation failed:', error.message);
    
    // Graceful error handling like other routes
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return NextResponse.json({
        success: false,
        data: null,
        fallback: true,
        message: 'Database temporarily unavailable'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create student',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * APPROACH 3: Multiple Operations Pattern
 * Shows how to perform multiple database operations efficiently
 */
export async function PUT(request: NextRequest) {
  try {
    // ✅ CORRECT: Single connection for multiple operations
    await dbConnect();
    
    const { studentIds, updates } = await request.json();
    
    // Multiple operations using the same cached connection
    const operations = await Promise.all([
      Student.countDocuments(),
      Student.find({ studentId: { $in: studentIds } }),
      Student.updateMany(
        { studentId: { $in: studentIds } },
        { $set: updates }
      )
    ]);
    
    const [totalCount, foundStudents, updateResult] = operations;
    
    return NextResponse.json({
      success: true,
      summary: {
        totalStudents: totalCount,
        foundStudents: foundStudents.length,
        updatedCount: updateResult.modifiedCount
      },
      data: foundStudents
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * DEBUGGING ENDPOINT: Connection Health Check
 * Useful for monitoring database connectivity in production
 */
export async function HEAD() {
  try {
    await dbConnect();
    const health = getConnectionHealth();
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-DB-Status': health.status,
        'X-DB-Ready-State': health.readyState.toString(),
        'X-DB-Host': health.host || 'unknown',
        'X-DB-Pool-Size': health.poolSize?.toString() || 'unknown'
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-DB-Error': error.message
      }
    });
  }
}