"use client"

import { useState, useEffect } from "react"
import { paymentRecords } from "../components/payment-data"
import { currencySymbols } from "../components/payment-types"

export default function PreviousPaymentsPage() {
  const [payments, setPayments] = useState(paymentRecords.filter(p => p.paymentStatus === "Paid"))

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#9234ea]">Previous Payments</h1>
      
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Activity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{payment.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{payment.activity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {currencySymbols[payment.currency]}{payment.totalPaidAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{payment.paidDate}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {payment.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}