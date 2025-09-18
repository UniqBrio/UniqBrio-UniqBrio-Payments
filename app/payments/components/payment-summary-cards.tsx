"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PaymentSummary } from './payment-types'

interface PaymentSummaryCardsProps {
  summary: PaymentSummary
}

export function PaymentSummaryCards({ summary }: PaymentSummaryCardsProps) {
  const { receivedPayment, outstandingPayment, totalPayment, profit } = summary
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-orange-50 border-orange-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium mb-2">Total Payments</p>
              <p className="text-2xl font-bold text-orange-800 mb-1">{totalPayment.toLocaleString()} INR</p>
              <p className="text-orange-500 text-xs">+3% from last month</p>
            </div>
            <div className="bg-orange-200 p-2 rounded-lg">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium mb-2">Received Payments</p>
              <p className="text-2xl font-bold text-green-800 mb-1">{receivedPayment.toLocaleString()} INR</p>
              <p className="text-green-500 text-xs">+2% from last month</p>
            </div>
            <div className="bg-green-200 p-2 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-50 border-red-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium mb-2">Outstanding Payments</p>
              <p className="text-2xl font-bold text-red-800 mb-1">{outstandingPayment.toLocaleString()} INR</p>
              <p className="text-red-500 text-xs">+4% from last month</p>
            </div>
            <div className="bg-red-200 p-2 rounded-lg">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200 rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-2">Profit Amount</p>
              <p className="text-2xl font-bold text-blue-800 mb-1">{profit.toLocaleString()} INR</p>
              <p className="text-blue-500 text-xs">Stable</p>
            </div>
            <div className="bg-blue-200 p-2 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
