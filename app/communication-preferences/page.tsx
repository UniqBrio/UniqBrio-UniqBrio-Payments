"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, RefreshCw, Users, Settings } from 'lucide-react'
import { CommunicationModeColumn } from '@/components/communication-mode-column'
import { toast } from '@/components/ui/use-toast'

interface Student {
  studentId: string
  name: string
  email: string
  communicationPreferences: {
    enabled: boolean
    channels: string[]
  }
}

export default function CommunicationPreferencesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all students with communication preferences
  const fetchStudents = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching all students with communication preferences')
      
      const response = await fetch('/api/students/list')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch students')
      }
      
      console.log('✅ Students loaded:', data.students?.length || 0)
      setStudents(data.students || [])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Error fetching students:', errorMessage)
      setError(errorMessage)
      toast({
        title: "Error",
        description: `Failed to load students: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Create test students
  const createTestStudents = async () => {
    try {
      console.log('🔧 Creating test students')
      
      const response = await fetch('/api/students/test-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test students')
      }
      
      console.log('✅ Test students created')
      toast({
        title: "Success",
        description: "Test students created successfully!",
        variant: "default",
      })
      
      // Refresh the list
      fetchStudents()
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Error creating test students:', errorMessage)
      toast({
        title: "Error",
        description: `Failed to create test students: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load students on component mount
  useEffect(() => {
    fetchStudents()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-[#9234ea]" />
          <h1 className="text-2xl font-bold">Communication Preferences</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchStudents}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={createTestStudents}
            variant="outline"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Create Test Data
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.communicationPreferences?.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Enabled Preferences</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {students.filter(s => !s.communicationPreferences?.enabled).length}
            </div>
            <div className="text-sm text-gray-600">Disabled Preferences</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {students.filter(s => s.communicationPreferences?.channels?.includes('Email')).length}
            </div>
            <div className="text-sm text-gray-600">Email Enabled</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search students by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students Communication Preferences ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading students...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">❌ {error}</div>
              <Button onClick={fetchStudents} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {students.length === 0 ? 'No students found' : 'No students match your search'}
              </div>
              {students.length === 0 && (
                <Button onClick={createTestStudents} variant="outline">
                  Create Test Students
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Communication Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-mono text-sm">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.email || 'No email'}
                      </TableCell>
                      <TableCell>
                        <CommunicationModeColumn
                          studentId={student.studentId}
                          studentName={student.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}