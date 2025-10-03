import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/models/student";
import Payment from "@/models/payment";
import { fetchLatestPaymentMethodServer } from "@/lib/payment-utils";

// Mark this route as dynamic since it uses request parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const student = await Student.findOne({ studentId });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Fetch latest payment method from payment records
    const paymentMethod = await fetchLatestPaymentMethodServer(student.studentId, Payment);

    // Generate payslip HTML
    const payslipHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${student.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #9234ea; padding-bottom: 30px; margin-bottom: 40px; }
            .logo { max-width: 250px; height: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto; }
            .company-name { font-size: 32px; font-weight: bold; color: #9234ea; margin-bottom: 5px; letter-spacing: 2px; }
            .receipt-title { font-size: 18px; margin-top: 10px; font-weight: 500; }
            .student-info { margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .payment-details { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; }
            .amount { font-size: 20px; font-weight: bold; color: #9234ea; }
            .footer { text-align: center; margin-top: 40px; color: #666; }
            .timestamp { text-align: right; font-size: 12px; color: #999; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
          
          <div class="header">
            <img src="/academy-logo.svg" alt="Academy Logo" class="logo" style="background-color: #2D2D2D; padding: 10px; border-radius: 5px;">
            <div class="receipt-title" style="font-size:24px; font-weight:600; letter-spacing:0.5px; margin-top:0;">Payment Receipt</div>
            <div style="margin-top:6px; font-size:14px; color:#555;">Course: ${(student.activity || student.course || 'N/A')}</div>
          </div>

          <div class="student-info">
            <div class="info-row">
              <strong>Student ID:</strong>
              <span>${student.studentId}</span>
            </div>
            <div class="info-row">
              <strong>Student Name:</strong>
              <span>${student.name}</span>
            </div>
            <div class="info-row">
              <strong>Course ID:</strong>
              <span>${student.activity || 'N/A'}</span>
            </div>
            <div class="info-row">
              <strong>Course Name:</strong>
              <span>${student.course || student.program || student.activity || 'N/A'}</span>
            </div>
            <div class="info-row">
              <strong>Category:</strong>
              <span>${student.category || 'Regular'}</span>
            </div>
            <div class="info-row">
              <strong>Payment Mode:</strong>
              <span>${paymentMethod}</span>
            </div>
          </div>

          <div class="payment-details">
            <h3>Payment Summary</h3>
            <div class="info-row">
              <strong>Total Course Fee:</strong>
              <span class="amount">₹${(student.courseFee || 0).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <strong>Amount Paid:</strong>
              <span style="color: green;">₹${(student.totalPaidAmount || 0).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <strong>Balance Due:</strong>
              <span style="color: red;">₹${Math.max(0, (student.courseFee || 0) - (student.totalPaidAmount || 0)).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <strong>Payment Status:</strong>
              <span style="font-weight: bold;">${student.paymentStatus || 'Pending'}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing UniqBrio!</p>
            <p style="font-size: 12px;">For any queries, please contact us at support@uniqbrio.com</p>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(payslipHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="payslip-${student.studentId}.html"`
      },
    });

  } catch (error) {
    console.error('Payslip generation error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payslip" },
      { status: 500 }
    );
  }
}