"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import MainLayout from "@/components/main-layout"

export default function PaymentsLoading() {
  return (
    <MainLayout>
      <div className="container mx-auto py-4 px-4">
        <div className="max-w-full mx-auto">
          {/* Header Skeleton */}
          <div className="mb-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-purple-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Skeleton */}
          <Card className="border-purple-200 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card className="border-purple-200 mb-6">
            <CardHeader className="bg-purple-50 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Table Header Skeleton */}
                <div className="flex border-b bg-white">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="p-2 min-w-[100px]">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                {/* Table Rows Skeleton */}
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <div key={rowIndex} className={`flex ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {Array.from({ length: 18 }).map((_, colIndex) => (
                      <div key={colIndex} className="p-2 min-w-[100px]">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Summary Skeleton */}
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Course Table Header Skeleton */}
                <div className="flex border-b bg-white">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="p-3 min-w-[120px]">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                {/* Course Table Rows Skeleton */}
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                  <div key={rowIndex} className={`flex ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                      <div key={colIndex} className="p-3 min-w-[120px]">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
