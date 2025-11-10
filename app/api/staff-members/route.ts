import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'Database connection not established' }, { status: 500 });
    }

    // Fetch non-instructors
    const nonInstructors = await db.collection('non_instructors').find({}).toArray();
    
    // Fetch instructors
    const instructors = await db.collection('instructors').find({}).toArray();

    // Format non-instructors
    const nonInstructorsList = nonInstructors.map((ni: any) => {
      const firstName = ni.firstName || '';
      const middleName = ni.middleName || '';
      const lastName = ni.lastName || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      const externalId = ni.externalId || '';
      
      return {
        value: externalId,
        label: `${fullName} (${externalId})`,
        role: 'non-instructor'
      };
    }).filter((item: any) => item.value); // Filter out entries without externalId

    // Format instructors
    const instructorsList = instructors.map((inst: any) => {
      const firstName = inst.firstName || '';
      const middleName = inst.middleName || '';
      const lastName = inst.lastName || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      const instructorId = inst.instructorId || '';
      
      return {
        value: instructorId,
        label: `${fullName} (${instructorId})`,
        role: 'instructor'
      };
    }).filter((item: any) => item.value); // Filter out entries without instructorId

    // Combine both lists with separator and "Other" option at the end
    const allStaff = [
      ...instructorsList,
      { value: '_separator_', label: '--- Non Instructors ---', role: 'separator', disabled: true },
      ...nonInstructorsList,
      { value: 'other', label: 'Other', role: 'other' }
    ];

    return NextResponse.json(allStaff);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return NextResponse.json({ error: 'Failed to fetch staff members' }, { status: 500 });
  }
}
