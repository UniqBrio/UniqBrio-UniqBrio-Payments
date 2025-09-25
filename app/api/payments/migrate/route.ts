import { connectDB } from "@/lib/db";
import Payment from "@/models/payment";
import Student from "@/models/student";
import { NextRequest, NextResponse } from "next/server";

// Migration API to convert old payment structure to new structure
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Starting payment collection migration...');
    
    // Step 1: Check if we have any documents in the old format (multiple docs per student)
    const allPayments = await Payment.find({}).lean();
    console.log(`Found ${allPayments.length} existing payment documents`);
    
    if (allPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No existing payment documents found. Ready for new structure.",
        migrated: 0
      });
    }
    
    // Step 2: Check if documents already have the new structure
    const hasNewStructure = allPayments.some(doc => doc.paymentRecords && Array.isArray(doc.paymentRecords));
    
    if (hasNewStructure) {
      return NextResponse.json({
        success: true,
        message: "Documents already appear to be in new structure.",
        totalDocuments: allPayments.length
      });
    }
    
    // Step 3: Group old payment documents by studentId
    const paymentsByStudent = allPayments.reduce((acc, payment) => {
      const studentId = payment.studentId;
      if (!acc[studentId]) {
        acc[studentId] = [];
      }
      acc[studentId].push(payment);
      return acc;
    }, {});
    
    console.log(`Grouping payments for ${Object.keys(paymentsByStudent).length} students`);
    
    // Step 4: Clear the existing collection
    await Payment.deleteMany({});
    console.log('Cleared existing payment documents');
    
    // Step 5: Create new documents with consolidated structure
    let migratedCount = 0;
    const migrationResults = [];
    
    for (const [studentId, payments] of Object.entries(paymentsByStudent)) {
      try {
        // Get student info
        const student = await Student.findOne({ studentId });
        const firstPayment = payments[0];
        
        // Calculate totals
        const completedPayments = payments.filter(p => p.paymentStatus === 'Completed');
        const totalPaidAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalCourseFee = firstPayment.totalCourseFee || student?.finalPayment || 0;
        const currentBalance = Math.max(0, totalCourseFee - totalPaidAmount);
        
        // Determine status
        let paymentStatus = 'Pending';
        if (currentBalance === 0 && totalPaidAmount > 0) {
          paymentStatus = 'Paid';
        } else if (totalPaidAmount > 0) {
          paymentStatus = 'Partial';
        }
        
        // Convert old payment documents to payment records
        const paymentRecords = payments.map(payment => ({
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency || 'INR',
          paymentType: payment.paymentType,
          paymentCategory: payment.paymentCategory,
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.paymentStatus,
          paymentDate: payment.paymentDate,
          dueDate: payment.dueDate,
          processedDate: payment.processedDate,
          receiverName: payment.receiverName,
          receiverId: payment.receiverId,
          notes: payment.notes || '',
          reference: payment.reference || '',
          attachments: payment.attachments || [],
          previousBalance: payment.previousBalance,
          newBalance: payment.newBalance,
          isManualPayment: payment.isManualPayment,
          recordedBy: payment.recordedBy,
          ipAddress: payment.ipAddress,
          userAgent: payment.userAgent,
          installmentNumber: payment.installmentNumber,
          totalInstallments: payment.totalInstallments,
          isEMI: payment.isEMI,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }));
        
        // Find latest payment date
        const latestPayment = completedPayments.sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        )[0];
        
        // Create new consolidated document
        const newPaymentDoc = new Payment({
          studentId,
          studentName: firstPayment.studentName || student?.name || 'Unknown',
          courseId: firstPayment.courseId,
          courseName: firstPayment.courseName,
          cohort: firstPayment.cohort,
          batch: firstPayment.batch,
          totalCourseFee,
          totalPaidAmount,
          currentBalance,
          currency: firstPayment.currency || 'INR',
          paymentStatus,
          paymentRecords,
          semester: firstPayment.semester,
          academicYear: firstPayment.academicYear,
          lastPaymentDate: latestPayment ? latestPayment.paymentDate : null,
          lastUpdatedBy: 'Migration Script'
        });
        
        await newPaymentDoc.save();
        migratedCount++;
        
        migrationResults.push({
          studentId,
          studentName: newPaymentDoc.studentName,
          oldRecords: payments.length,
          newRecords: paymentRecords.length,
          totalPaid: totalPaidAmount,
          balance: currentBalance,
          status: paymentStatus
        });
        
        console.log(`Migrated ${payments.length} payments for student ${studentId}`);
        
      } catch (error) {
        console.error(`Error migrating student ${studentId}:`, error);
        migrationResults.push({
          studentId,
          error: error.message
        });
      }
    }
    
    console.log(`Migration completed. Migrated ${migratedCount} students.`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated payment data for ${migratedCount} students`,
      migrated: migratedCount,
      totalStudents: Object.keys(paymentsByStudent).length,
      results: migrationResults
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}