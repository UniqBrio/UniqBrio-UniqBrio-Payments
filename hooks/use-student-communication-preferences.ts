"use client"

import { useState, useCallback } from 'react'

interface CommunicationPreferences {
  enabled: boolean
  channels: string[]
}

interface StudentCommunicationData {
  studentId: string
  name: string
  communicationPreferences: CommunicationPreferences
}

export const useStudentCommunicationPreferences = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch communication preferences from students collection
  const fetchCommunicationPreferences = useCallback(async (studentId: string): Promise<CommunicationPreferences | null> => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Fetching communication preferences for student:', studentId)
      
      const response = await fetch(`/api/students/communication-preferences?studentId=${encodeURIComponent(studentId)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch communication preferences')
      }
      
      console.log('✅ Communication preferences fetched:', data.communicationPreferences)
      return data.communicationPreferences
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Error fetching communication preferences:', errorMessage)
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // UPDATE OPERATIONS REMOVED - READ-ONLY ACCESS ONLY

  // Get default communication preferences
  const getDefaultCommunicationPreferences = useCallback((): CommunicationPreferences => {
    return {
      enabled: true,
      channels: ["Email"]
    }
  }, [])

  // Validate communication preferences structure
  const validateCommunicationPreferences = useCallback((preferences: any): CommunicationPreferences => {
    const validChannels = ["Email", "SMS", "WhatsApp", "In App", "Push Notification"]
    
    // Ensure preferences has the correct structure
    const validated: CommunicationPreferences = {
      enabled: preferences?.enabled === true,
      channels: Array.isArray(preferences?.channels) 
        ? preferences.channels.filter((channel: string) => validChannels.includes(channel))
        : ["Email"] // Default to Email if invalid
    }
    
    // Ensure at least one channel is selected if enabled
    if (validated.enabled && validated.channels.length === 0) {
      validated.channels = ["Email"]
    }
    
    return validated
  }, [])

  return {
    loading,
    error,
    fetchCommunicationPreferences,
    // updateCommunicationPreferences - REMOVED (READ-ONLY)
    getDefaultCommunicationPreferences,
    validateCommunicationPreferences
  }
}