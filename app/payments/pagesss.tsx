// "use client"

// import { useState } from "react"
// import MainLayout from "@/components/main-layout"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { toast } from "@/components/ui/use-toast"
// import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
// import { FileText } from "lucide-react"

// // Payment components
// import { PaymentFilters } from './components/payment-filters'
// import { PaymentSummaryCards } from './components/payment-summary-cards'
// import { CourseWisePaymentPopup } from './components/course-wise-payment-popup'
// import { StudentManualPayment, StudentManualPaymentPayload } from './components/student-manual-payment'
// import { PaymentTable } from './components/payment-table'
// import { PaymentGrid } from './components/payment-grid'
// import { usePaymentLogic } from './components/use-payment-logic'
// import { courseWisePayments } from './components/payment-data'

// export default function PaymentStatusPage() {
//   const {
//     searchTerm,
//     setSearchTerm,
//     statusFilters,
//     setStatusFilters,
//     categoryFilters,
//     setCategoryFilters,
//     filteredRecords,
//     viewMode,
//     setViewMode,
//     records,
//     columns,
//     paymentSummary,
//     handleFilter,
//     handleUpdateRecord,
//     handleColumnToggle,
//     isColumnVisible,
//     handleExport,
//     loading,
//     error
//   } = usePaymentLogic()

//   const [showCourseWisePopup, setShowCourseWisePopup] = useState(false)

//   const handleStudentManualPayment = (payload: StudentManualPaymentPayload) => {
//     const target = records.find((r) => r.id === payload.studentId)
//     if (!target) return

//     try {
//       const newTotalPaid = (target.totalPaidAmount || 0) + payload.amount
//       const newBalance = Math.max(0, target.finalPayment - newTotalPaid)
      
//       handleUpdateRecord(payload.studentId, {
//         totalPaidAmount: newTotalPaid,
//         balancePayment: newBalance,
//         paidDate: payload.date,
//         paymentStatus: newBalance === 0 ? "Paid" : newTotalPaid > 0 ? "Partial" : target.paymentStatus,
//       })

//       toast({
//         title: "Manual Payment Recorded",
//         description: `Payment of ${payload.amount} recorded for ${target.name}`,
//       })
//     } catch (error) {
//       toast({
//         title: "Error",
//         description: "Failed to record payment",
//         variant: "destructive"
//       })
//     }
//   }


//   return (
//     <MainLayout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
//             <p className="text-gray-600 mt-1">Track student payments, send reminders, and manage financial records</p>
//           </div>
//           <div className="flex gap-2">
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <div>
//                   <StudentManualPayment 
//                     students={records}
//                     onSubmit={handleStudentManualPayment}
//                   />
//                 </div>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <p>Record offline payments received in cash, UPI, or card</p>
//               </TooltipContent>
//             </Tooltip>
            
//             <Tooltip>
//               <TooltipTrigger asChild>
//                 <Button
//                   onClick={() => setShowCourseWisePopup(true)}
//                   className="bg-purple-600 hover:bg-purple-700 "
//                 >
//                   <FileText className="h-4 w-4 mr-2" />
//                   Course Summary
//                 </Button>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <p>View payment collection summary grouped by courses</p>
//               </TooltipContent>
//             </Tooltip>
//           </div>
//         </div>

//         {/* Payment Summary Cards */}
//         <PaymentSummaryCards summary={paymentSummary} />

//         {/* Filters */}
//         <PaymentFilters
//           searchTerm={searchTerm}
//           setSearchTerm={setSearchTerm}
//           statusFilters={statusFilters}
//           setStatusFilters={setStatusFilters}
//           categoryFilters={categoryFilters}
//           setCategoryFilters={setCategoryFilters}
//           viewMode={viewMode}
//           setViewMode={setViewMode}
//           onExport={handleExport}
//           columns={columns}
//           onColumnToggle={handleColumnToggle}
//         />

//         {/* Loading and Error States */}
//         {loading && (
//           <Card>
//             <CardContent className="p-8 text-center">
//               <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 rounded-full" />
//               <p className="mt-2 text-gray-600">Loading student payment data from database...</p>
//             </CardContent>
//           </Card>
//         )}

//         {error && !loading && (
//           <Card>
//             <CardContent className="p-8 text-center">
//               <p className="text-red-600 mb-2">⚠️ {error}</p>
//               <p className="text-gray-600">Please check your database connection and ensure the Students collection exists.</p>
//             </CardContent>
//           </Card>
//         )}

//         {/* Payment View - Grid or Table */}
//         {!loading && !error && (
//           <>
//             {filteredRecords.length === 0 ? (
//               <Card>
//                 <CardContent className="p-8 text-center">
//                   <p className="text-gray-600">No student payment records found in the database.</p>
//                   <p className="text-sm text-gray-500 mt-2">Add student data to the "Students" collection to see payment records here.</p>
//                 </CardContent>
//               </Card>
//             ) : (
//               <>
//                 {viewMode === "grid" ? (
//                   <PaymentGrid
//                     filteredRecords={filteredRecords}
//                     onUpdateRecord={handleUpdateRecord}
//                   />
//                 ) : (
//                   <PaymentTable
//                     filteredRecords={filteredRecords}
//                     isColumnVisible={isColumnVisible}
//                     onUpdateRecord={handleUpdateRecord}
//                   />
//                 )}
//               </>
//             )}
//           </>
//         )}

//         {/* Course Wise Payment Popup */}
//         <CourseWisePaymentPopup
//           open={showCourseWisePopup}
//           onClose={() => setShowCourseWisePopup(false)}
//           courseData={courseWisePayments}
//         />
//       </div>
//     </MainLayout>
//   )
// }