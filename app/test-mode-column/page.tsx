"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommunicationModeColumnCompact } from '@/components/communication-mode-column'

export default function TestModeColumn() {
  const [testStudents, setTestStudents] = useState([
    { id: 'STU001', name: 'John Doe' },
    { id: 'STU002', name: 'Jane Smith' }, 
    { id: 'STU003', name: 'Mike Johnson' }
  ])
  
  const [apiStatus, setApiStatus] = useState<string>('Not tested')
  
  const checkExistingData = async () => {
    try {
      setApiStatus('Checking existing data...')
      
      const response = await fetch('/api/students/test-create')
      
      const result = await response.json()
      
      if (response.ok) {
        setApiStatus('✅ Existing data checked!')
        console.log('Existing data:', result)
      } else {
        setApiStatus(`❌ Failed: ${result.error}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setApiStatus(`❌ Error: ${errorMsg}`)
      console.error('Error checking data:', error)
    }
  }
  
  const testStudentAPI = async () => {
    try {
      setApiStatus('Testing student API...')
      
      const response = await fetch('/api/students/list')
      const result = await response.json()
      
      if (response.ok) {
        setApiStatus(`✅ Found ${result.students?.length || 0} students in collection`)
        console.log('Students from API:', result.students)
      } else {
        setApiStatus(`❌ API Error: ${result.error}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setApiStatus(`❌ Network Error: ${errorMsg}`)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">🧪 Mode Column Test</h1>
        <p className="text-gray-600">Testing communication preferences from students collection</p>
      </div>

      {/* API Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>API Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkExistingData} variant="outline">
              � Check Existing Data
            </Button>
            <Button onClick={testStudentAPI} variant="outline">
              📋 Test Students API
            </Button>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <strong>Status:</strong> {apiStatus}
          </div>
        </CardContent>
      </Card>

      {/* Mode Column Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Mode Column Examples</CardTitle>
          <p className="text-sm text-gray-600">
            Each example shows communication preferences fetched from students collection
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {testStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">Student ID: {student.id}</div>
                </div>
                
                <div className="flex-1 flex justify-center">
                  <CommunicationModeColumnCompact 
                    studentId={student.id}
                    studentName={student.name}
                    className="w-full max-w-xs"
                  />
                </div>
                
                <div className="flex-1 flex justify-end">
                  <Badge variant="outline">Mode Column Display</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expected Data Structure */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Expected Data Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded font-mono text-sm">
            <div className="text-green-600">// Students Collection Document</div>
            <div>{`{`}</div>
            <div className="ml-2">{`studentId: "STU001",`}</div>
            <div className="ml-2">{`name: "John Doe",`}</div>
            <div className="ml-2">{`communicationPreferences: {`}</div>
            <div className="ml-4 text-blue-600">{`enabled: true,`}</div>
            <div className="ml-4 text-blue-600">{`channels: ["Email", "In App"]`}</div>
            <div className="ml-2">{`}`}</div>
            <div>{`}`}</div>
          </div>
          
          <div className="mt-4 text-sm space-y-2">
            <div><strong>STU001:</strong> Should show "📧 Email, 🔔 In App" (2 channels)</div>
            <div><strong>STU002:</strong> Should show "💬 SMS, 📱 WhatsApp" (2 channels)</div>
            <div><strong>STU003:</strong> Should show "📧 Email, 💬 SMS, 📱 WhatsApp" (3 channels)</div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Create Test Data:</strong> Click "Create Test Data" to populate students collection</li>
            <li><strong>Verify API:</strong> Click "Test Students API" to confirm data exists</li>
            <li><strong>Check Mode Column:</strong> Each row above should show communication preferences</li>
            <li><strong>Expected Result:</strong> Mode column displays channels from students collection</li>
            <li><strong>Verify Logs:</strong> Check browser console for detailed fetching logs</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}