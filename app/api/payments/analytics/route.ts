import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const courseId = searchParams.get('courseId');
    const cohort = searchParams.get('cohort');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));
    
    // Build query filters
    const paymentQuery: any = {
      paymentDate: { $gte: startDate },
      paymentStatus: 'Completed'
    };
    
    if (courseId) paymentQuery.courseId = courseId;
    if (cohort) paymentQuery.cohort = cohort;
    
    // Get payments within timeframe
    const payments = await Payment.find(paymentQuery).sort({ paymentDate: -1 });
    
    // Get all students for overall statistics
    const students = await Student.find({}).lean();
    
    // Revenue Analytics
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averagePaymentAmount = payments.length > 0 ? totalRevenue / payments.length : 0;
    
    // Payment Method Distribution
    const paymentMethodStats = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Daily Revenue Trend
    const dailyRevenue = payments.reduce((acc, payment) => {
      const date = payment.paymentDate.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Course-wise Revenue
    const courseRevenue = payments.reduce((acc, payment) => {
      acc[payment.courseName] = (acc[payment.courseName] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Cohort-wise Analytics
    const cohortStats = payments.reduce((acc, payment) => {
      const key = payment.cohort || 'Unassigned';
      if (!acc[key]) {
        acc[key] = { totalRevenue: 0, studentCount: 0, payments: 0 };
      }
      acc[key].totalRevenue += payment.amount;
      acc[key].payments += 1;
      return acc;
    }, {} as Record<string, any>);
    
    // Payment Status Distribution
    const statusDistribution = students.reduce((acc, student) => {
      const status = student.paymentStatus || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Outstanding Payments Analysis
    const outstandingPayments = students.reduce((acc, student) => {
      if (student.balancePayment && student.balancePayment > 0) {
        acc.totalOutstanding += student.balancePayment;
        acc.studentCount += 1;
        
        // Categorize by urgency
        const nextDue = student.nextPaymentDate ? new Date(student.nextPaymentDate) : new Date();
        const daysUntilDue = Math.ceil((nextDue.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 0) {
          acc.overdue += student.balancePayment;
          acc.overdueCount += 1;
        } else if (daysUntilDue <= 3) {
          acc.pending += student.balancePayment;
          acc.pendingCount += 1;
        } else {
          acc.upcoming += student.balancePayment;
          acc.upcomingCount += 1;
        }
      }
      return acc;
    }, {
      totalOutstanding: 0,
      studentCount: 0,
      overdue: 0,
      overdueCount: 0,
      pending: 0,
      pendingCount: 0,
      upcoming: 0,
      upcomingCount: 0
    });
    
    // Top Performing Courses
    const topCourses = Object.entries(courseRevenue)
      .map(([course, revenue]) => ({ course, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Recent High-Value Transactions
    const highValueTransactions = payments
      .filter(p => p.amount >= 1000)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(p => ({
        transactionId: p.transactionId,
        studentName: p.studentName,
        amount: p.amount,
        course: p.courseName,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod
      }));
    
    // Monthly Growth Trend
    const monthlyGrowth = payments.reduce((acc, payment) => {
      const monthYear = payment.paymentDate.toISOString().slice(0, 7); // YYYY-MM
      acc[monthYear] = (acc[monthYear] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const analytics = {
      overview: {
        totalRevenue,
        totalTransactions: payments.length,
        averagePaymentAmount,
        totalStudents: students.length,
        timeframe: `Last ${timeframe} days`
      },
      
      revenue: {
        dailyRevenue: Object.entries(dailyRevenue)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        monthlyGrowth: Object.entries(monthlyGrowth)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        paymentMethodDistribution: Object.entries(paymentMethodStats)
          .map(([method, amount]) => ({ method, amount, percentage: ((amount / totalRevenue) * 100).toFixed(1) }))
      },
      
      courses: {
        topPerforming: topCourses,
        courseRevenue: Object.entries(courseRevenue)
          .map(([course, revenue]) => ({ course, revenue }))
      },
      
      cohorts: {
        cohortStats: Object.entries(cohortStats)
          .map(([cohort, stats]) => ({ cohort, ...stats }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
      },
      
      payments: {
        statusDistribution: Object.entries(statusDistribution)
          .map(([status, count]) => ({ status, count, percentage: ((count / students.length) * 100).toFixed(1) })),
        outstandingAnalysis: outstandingPayments,
        highValueTransactions
      },
      
      trends: {
        paymentFrequency: payments.reduce((acc, payment) => {
          const hour = payment.paymentDate.getHours();
          const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
          acc[timeSlot] = (acc[timeSlot] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        
        weekdayDistribution: payments.reduce((acc, payment) => {
          const weekday = payment.paymentDate.toLocaleDateString('en-US', { weekday: 'long' });
          acc[weekday] = (acc[weekday] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}