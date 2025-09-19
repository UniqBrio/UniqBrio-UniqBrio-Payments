"use client"

import { PaymentTable } from './payment-table'
import { PaymentGrid } from './payment-grid'
import { PaymentEmptyState } from './payment-states'

interface PaymentContentProps {
  filteredRecords: any[]
  viewMode: "grid" | "list"
  isColumnVisible: (key: string) => boolean
  onUpdateRecord: (id: string, updates: any) => void
}

import React, { useState } from 'react';

export function PaymentContent({ 
  filteredRecords, 
  viewMode, 
  isColumnVisible, 
  onUpdateRecord 
}: PaymentContentProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  if (filteredRecords.length === 0) {
    return <PaymentEmptyState />
  }

  return (
    <>
      {viewMode === "grid" ? (
        <PaymentGrid
          filteredRecords={filteredRecords}
          onUpdateRecord={onUpdateRecord}
        />
      ) : (
        <PaymentTable
          filteredRecords={filteredRecords}
          isColumnVisible={isColumnVisible}
          onUpdateRecord={onUpdateRecord}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      )}
    </>
  )
}