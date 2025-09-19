// "use client"

// import { useState, useEffect } from "react"
// import { currencySymbols } from "../components/payment-types"
// // Define PaymentRecord type locally to match paymentRecords structure
// type PaymentRecord = {
//   id: string
//   name: string
//   activity: string
//   currency: string
//   totalPaidAmount: number
//   paidDate: string
//   paymentStatus: string
// }

// export default function PreviousPaymentsPage() {
//   const [payments, setPayments] = useState<PaymentRecord[]>([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     // Import paymentRecords dynamically to avoid SSR issues
//     import("../components/payment-data")
//       .then((module) => {
//         console.log("Imported module keys:", Object.keys(module));
//         console.log("paymentRecords value:", module.paymentRecords);
//         if (module.paymentRecords && Array.isArray(module.paymentRecords)) {
//           const paidPayments = module.paymentRecords.filter(p => p.paymentStatus === "Paid")
//           setPayments(paidPayments)
//         } else {
//           console.error('paymentRecords is not available or not an array')
//           setPayments([])
//         }
//         setLoading(false)
//       })
//       .catch((error) => {
//         console.error('Error importing payment data:', error)
//         setPayments([])
//         setLoading(false)
//       })
//   }, [])

//   if (loading) {
//     return (
//       <div className="p-6">
//         <h1 className="text-2xl font-bold mb-6 text-[#9234ea]">Previous Payments</h1>
//         <div className="bg-white rounded-lg border p-8 text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9234ea] mx-auto"></div>
//           <p className="mt-2 text-gray-600">Loading payments...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6 text-[#9234ea]">Previous Payments</h1>
      
//       {payments.length === 0 ? (
//         <div className="bg-white rounded-lg border p-8 text-center">
//           <p className="text-gray-600">No previous payments found.</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded-lg border overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Activity</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {payments.map((payment) => (
//                   <tr key={payment.id} className="hover:bg-gray-50">
//                     <td className="px-4 py-3 text-sm text-gray-900">{payment.name}</td>
//                     <td className="px-4 py-3 text-sm text-gray-900">{payment.activity}</td>
//                     <td className="px-4 py-3 text-sm text-gray-900">
//                       {currencySymbols[payment.currency]}{payment.totalPaidAmount.toLocaleString()}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-900">{payment.paidDate}</td>
//                     <td className="px-4 py-3 text-sm">
//                       <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                         {payment.paymentStatus}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }