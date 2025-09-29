"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Mail, MessageSquare, Phone, Bell, Smartphone } from 'lucide-react'
import { useStudentCommunicationPreferences } from '@/hooks/use-student-communication-preferences'

interface CommunicationModeColumnProps {
  studentId: string
  studentName: string
  className?: string
}

export function CommunicationModeColumn({ studentId, studentName, className = "" }: CommunicationModeColumnProps) {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { fetchCommunicationPreferences } = useStudentCommunicationPreferences()

  // Fetch communication preferences on component mount
  useEffect(() => {
    const fetchPrefs = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('🔍 Fetching communication preferences for:', studentId)
        const prefs = await fetchCommunicationPreferences(studentId)
        
        if (prefs) {
          console.log('✅ Communication preferences loaded:', prefs)
          setPreferences(prefs)
        } else {
          setError('No preferences found')
        }
      } catch (err) {
        console.error('❌ Error fetching preferences:', err)
        setError('Failed to load preferences')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchPrefs()
    }
  }, [studentId, fetchCommunicationPreferences])

  // Get icon for communication channel
  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return <Mail className="h-3 w-3" />
      case 'sms':
        return <MessageSquare className="h-3 w-3" />
      case 'whatsapp':
        return <Phone className="h-3 w-3" />
      case 'in app':
        return <Bell className="h-3 w-3" />
      case 'push notification':
        return <Smartphone className="h-3 w-3" />
      default:
        return <Mail className="h-3 w-3" />
    }
  }

  // Get color variant for channel badge
  const getChannelVariant = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return 'default'
      case 'sms':
        return 'secondary'
      case 'whatsapp':
        return 'outline'
      case 'in app':
        return 'destructive'
      case 'push notification':
        return 'outline'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-500">-</span>
      </div>
    )
  }

  if (error || !preferences) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-xs text-gray-500">-</span>
      </div>
    )
  }

  const { enabled, channels = [] } = preferences

  if (!enabled) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-xs text-gray-500">-</span>
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span className="text-xs text-gray-500">-</span>
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center gap-1">
        <Badge 
          variant={enabled ? "default" : "destructive"} 
          className="text-xs"
        >
          {enabled ? "🟢 Enabled" : "🔴 Disabled"}
        </Badge>
      </div>
      
      {/* Communication channels */}
      <div className="flex flex-wrap gap-1">
        {channels.map((channel: string, index: number) => (
          <Badge 
            key={`${channel}-${index}`}
            variant={getChannelVariant(channel)}
            className="text-xs flex items-center gap-1"
          >
            {getChannelIcon(channel)}
            {channel}
          </Badge>
        ))}
      </div>
    </div>
  )
}

// Compact version for table cells - Only GET from students collection (READ-ONLY)
export function CommunicationModeColumnCompact({ studentId, studentName, className = "" }: CommunicationModeColumnProps) {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrefsReadOnly = async () => {
      try {
        console.log(`🔍 [READ-ONLY] Fetching preferences for student: ${studentId}`)
        
        // Only GET from students collection - no modifications
        const response = await fetch(`/api/students/communication-preferences?studentId=${encodeURIComponent(studentId)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch preferences')
        }
        
        const data = await response.json()
        
        if (data.communicationPreferences) {
          console.log(`✅ [READ-ONLY] Found preferences for ${studentId}:`, data.communicationPreferences)
          setPreferences(data.communicationPreferences)
        } else {
          console.log(`⚠️ [READ-ONLY] No preferences found for ${studentId}`)
          setError('No preferences found')
        }
      } catch (error) {
        console.error(`❌ [READ-ONLY] Error fetching preferences for ${studentId}:`, error)
        setError('Failed to load')
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      fetchPrefsReadOnly()
    }
  }, [studentId])

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email': return '📧'
      case 'sms': return '💬'
      case 'whatsapp': return '📱'
      case 'in app': return '🔔'
      case 'push notification': return '📲'
      default: return '📧'
    }
  }

  if (loading) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        -
      </div>
    )
  }

  if (error || !preferences) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        -
      </div>
    )
  }

  const { enabled, channels = [] } = preferences

  if (!enabled) {
    return (
      <div className={`text-xs ${className}`}>
        -
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className={`text-xs ${className}`}>
        -
      </div>
    )
  }

  // Show ALL channels that exist in the students collection
  return (
    <div className={`text-xs ${className}`}>
      <div className="flex flex-wrap gap-1">
        {channels.map((channel: string, index: number) => (
          <div key={index} className="flex items-center gap-1 bg-blue-50 px-1 py-0.5 rounded text-[10px]">
            {getChannelIcon(channel)}
            {channel}
          </div>
        ))}
      </div>
    </div>
  )
}