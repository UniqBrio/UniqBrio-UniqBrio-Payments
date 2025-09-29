"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

export default function TestCommunicationAPI() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState('STU001')

  const testAPI = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? JSON.stringify(body) : undefined
      })
      
      const data = await response.json()
      
      setResults({
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        data
      })
      
      console.log('API Test Result:', {
        endpoint,
        method,
        status: response.status,
        data
      })
      
    } catch (error) {
      setResults({
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🧪 Test Communication API</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>API Testing Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-40"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testAPI('/api/students/test-create')}
              disabled={loading}
              variant="outline"
            >
              � Check Existing Students
            </Button>
            
            <Button
              onClick={() => testAPI('/api/students/list')}
              disabled={loading}
              variant="outline"
            >
              📋 List All Students
            </Button>
            
            <Button
              onClick={() => testAPI(`/api/students/communication-preferences?studentId=${studentId}`)}
              disabled={loading}
              variant="outline"
            >
              🔍 Get Student Preferences
            </Button>
            

          </div>
          
          {loading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Testing API...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Test Results
              <Badge variant={results.success ? "default" : "destructive"}>
                {results.method} {results.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Endpoint:</strong> {results.endpoint}</div>
              <div><strong>Method:</strong> {results.method}</div>
              <div><strong>Status:</strong> {results.status}</div>
              
              <div>
                <strong>Response:</strong>
                <Textarea
                  value={JSON.stringify(results.data || results.error, null, 2)}
                  className="mt-2 h-40 font-mono text-sm"
                  readOnly
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📖 API Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <strong>GET /api/students/list</strong>
              <p className="text-gray-600">Lists all students with their communication preferences</p>
            </div>
            
            <div>
              <strong>GET /api/students/communication-preferences?studentId=STU001</strong>
              <p className="text-gray-600">Gets communication preferences for a specific student</p>
            </div>
            
            <div>
              <strong>POST /api/students/communication-preferences</strong>
              <p className="text-gray-600">Updates communication preferences for a student</p>
              <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
                {JSON.stringify({
                  studentId: "STU001",
                  communicationPreferences: {
                    enabled: true,
                    channels: ["Email", "In App"]
                  }
                }, null, 2)}
              </code>
            </div>
            
            <div>
              <strong>POST /api/students/test-create</strong>
              <p className="text-gray-600">Creates test students with sample communication preferences</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}