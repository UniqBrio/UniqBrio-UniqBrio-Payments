"use client"

import { Card, CardContent } from "@/components/ui/card"

interface PaymentStatesProps {
  loading: boolean
  error: string | null
}

export function PaymentLoadingState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
  <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-[#9234ea] rounded-full" />
        <p className="mt-2 text-gray-600">Loading student payment data from database...</p>
      </CardContent>
    </Card>
  )
}

export function PaymentErrorState({ error }: { error: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-red-600 mb-2">⚠️ {error}</p>
        <p className="text-gray-600">Please check your database connection and ensure the Students collection exists.</p>
      </CardContent>
    </Card>
  )
}

export function PaymentEmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-gray-600">No student payment records found in the database.</p>
        <p className="text-sm text-gray-500 mt-2">Add student data to the "Students" collection to see payment records here.</p>
      </CardContent>
    </Card>
  )
}