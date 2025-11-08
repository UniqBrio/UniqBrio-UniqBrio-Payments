import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Cohort from '@/models/cohort';

/**
 * GET /api/cohorts
 * Fetches all cohorts from the database
 * Query params:
 * - courseId: Filter by specific course
 * - status: Filter by status (Active, Completed, Upcoming, Cancelled)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    // Build query
    const query: any = {};
    if (courseId) {
      query.courseId = courseId;
    }
    if (status) {
      query.status = status;
    }

    const cohorts = await Cohort.find(query)
      .sort({ startDate: -1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: cohorts,
      count: cohorts.length
    });
  } catch (error: any) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cohorts',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cohorts
 * Creates a new cohort
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate required fields
    if (!body.cohortId || !body.name || !body.courseId || !body.courseName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['cohortId', 'name', 'courseId', 'courseName']
        },
        { status: 400 }
      );
    }

    // Check if cohort already exists
    const existingCohort = await Cohort.findOne({ cohortId: body.cohortId });
    if (existingCohort) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cohort with this ID already exists'
        },
        { status: 409 }
      );
    }

    const cohort = new Cohort(body);
    await cohort.save();

    return NextResponse.json(
      {
        success: true,
        data: cohort,
        message: 'Cohort created successfully'
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating cohort:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create cohort',
        message: error.message
      },
      { status: 500 }
    );
  }
}
