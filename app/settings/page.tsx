"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Wrench } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your academy management system</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card className="border-purple-200">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <Wrench className="h-16 w-16 mx-auto text-purple-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings Coming Soon</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                We're working on comprehensive settings to help you configure your academy management system. 
                This will include payment settings, notification preferences, user management, and much more.
              </p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Stay Tuned for Updates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}