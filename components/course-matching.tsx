import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Users, GraduationCap, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MatchResult {
  studentId: string;
  studentName: string;
  matchedCourse?: string;
  courseId?: string;
  oldFinalPayment?: number;
  newFinalPayment?: number;
  updated: boolean;
  created?: boolean;
  error?: string;
  reason?: string;
}

interface MatchSummary {
  totalStudents: number;
  totalCourses: number;
  studentsMatched: number;
  paymentsUpdated: number;
  unmatchedStudents: number;
}

export default function CourseMatchingComponent() {
  const [isMatching, setIsMatching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState<MatchSummary | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMatching = async () => {
    setIsMatching(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments/match-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMatchResults(result.matches || []);
        setSummary(result.summary);
      } else {
        setError(result.error || 'Failed to run matching process');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Matching error:', err);
    } finally {
      setIsMatching(false);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payments/match-courses', {
        method: 'GET'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        setError(result.error || 'Failed to run analysis');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (result: MatchResult) => {
    if (result.updated) {
      return <Badge className="bg-green-100 text-green-800">Updated</Badge>;
    } else if (result.error) {
      return <Badge variant="destructive">Error</Badge>;
    } else {
      return <Badge variant="secondary">No Match</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Course-Student Matching System
          </CardTitle>
          <CardDescription>
            Match students with courses based on activity, name, and level criteria to update final payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runAnalysis}
              disabled={isAnalyzing}
              variant="outline"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Analyze Data
            </Button>
            
            <Button 
              onClick={runMatching}
              disabled={isMatching}
            >
              {isMatching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Run Course Matching
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Data Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.totalCourses}</div>
                <div className="text-sm text-gray-600">Active Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.studentsWithActivity}</div>
                <div className="text-sm text-gray-600">Students with Activity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analysis.coursesWithPricing}</div>
                <div className="text-sm text-gray-600">Courses with Pricing</div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Students with Level:</strong> {analysis.studentsWithLevel}
              </div>
              <div>
                <strong>Courses with ID:</strong> {analysis.coursesWithId}
              </div>
              <div>
                <strong>Payments with Final Amount:</strong> {analysis.paymentsWithFinalPayment}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Matching Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{summary.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.studentsMatched}</div>
                <div className="text-sm text-gray-600">Students Matched</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.paymentsUpdated}</div>
                <div className="text-sm text-gray-600">Payments Updated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{summary.unmatchedStudents}</div>
                <div className="text-sm text-gray-600">Unmatched</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.totalCourses}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {matchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Results</CardTitle>
            <CardDescription>
              Detailed results of the course matching process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {matchResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{result.studentName}</div>
                    <div className="text-sm text-gray-600">ID: {result.studentId}</div>
                    {result.matchedCourse && (
                      <div className="text-sm text-blue-600">Matched: {result.matchedCourse}</div>
                    )}
                    {result.reason && (
                      <div className="text-sm text-orange-600">Reason: {result.reason}</div>
                    )}
                    {result.error && (
                      <div className="text-sm text-red-600">Error: {result.error}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {result.updated && (
                      <div className="text-right text-sm">
                        <div>₹{result.oldFinalPayment || 0} → ₹{result.newFinalPayment || 0}</div>
                        {result.created && <div className="text-green-600">New Payment</div>}
                      </div>
                    )}
                    {getStatusBadge(result)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Matching Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Rule 1:</strong> students.activity must match courses.courseId</p>
            <p><strong>Rule 2:</strong> students.name must match courses.program (or name)</p>
            <p><strong>Rule 3:</strong> students.level must match courses.category (or level)</p>
            <p className="text-gray-600 mt-4">
              All three conditions must be met for a match. When matched, the courses.priceINR 
              value will update the finalPayments column in the payments table for that student.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}