"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Mail, Share2, Target, Users, Gift, Calendar, BarChart3 } from "lucide-react"

export function MarketingToolsTab() {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Marketing Tools - Coming Soon!</h3>
        </div>
        <p className="text-sm text-blue-700">
          Advanced marketing features are currently in development. Preview the upcoming tools below.
        </p>
      </div>

      {/* Email Marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Marketing Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input id="campaignName" placeholder="Course Launch Campaign" disabled />
            </div>
            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <select
                id="targetAudience"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                disabled
              >
                <option>All Students</option>
                <option>Enrolled Students</option>
                <option>Prospective Students</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Textarea id="emailTemplate" placeholder="Create engaging email content..." rows={4} disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-send on enrollment</Label>
              <p className="text-sm text-muted-foreground">Automatically send welcome emails</p>
            </div>
            <Switch disabled />
          </div>

          <Button disabled className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>

      {/* Social Media Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Facebook</h4>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Share course updates and engage with students</p>
              <Button variant="outline" size="sm" disabled>
                Connect Facebook
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">LinkedIn</h4>
                <Badge variant="outline">Not Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Reach professional audiences</p>
              <Button variant="outline" size="sm" disabled>
                Connect LinkedIn
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="socialPost">Social Media Post</Label>
            <Textarea id="socialPost" placeholder="Craft your social media announcement..." rows={3} disabled />
          </div>

          <Button disabled className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Schedule Post
          </Button>
        </CardContent>
      </Card>

      {/* Promotional Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Promotional Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="promoCode">Promo Code</Label>
              <Input id="promoCode" placeholder="EARLY2024" disabled />
            </div>
            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input id="discount" type="number" placeholder="20" disabled />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" disabled />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" disabled />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Limited Time Offer</Label>
              <p className="text-sm text-muted-foreground">Create urgency with countdown</p>
            </div>
            <Switch disabled />
          </div>

          <Button disabled className="w-full">
            <Gift className="mr-2 h-4 w-4" />
            Create Promotion
          </Button>
        </CardContent>
      </Card>

      {/* Analytics & Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Marketing Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">--</div>
              <div className="text-sm text-blue-600">Email Open Rate</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">--</div>
              <div className="text-sm text-green-600">Click Through Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">--</div>
              <div className="text-sm text-purple-600">Conversion Rate</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Campaign Performance</h4>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Analytics charts will appear here</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Top Performing Content</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Course announcement email</span>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Social media post</span>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referralReward">Referral Reward (%)</Label>
              <Input id="referralReward" type="number" placeholder="10" disabled />
            </div>
            <div>
              <Label htmlFor="refereeReward">Referee Reward (%)</Label>
              <Input id="refereeReward" type="number" placeholder="5" disabled />
            </div>
          </div>

          <div>
            <Label htmlFor="referralMessage">Referral Message</Label>
            <Textarea id="referralMessage" placeholder="Invite your friends and earn rewards..." rows={3} disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Referral Program</Label>
              <p className="text-sm text-muted-foreground">Allow students to refer friends</p>
            </div>
            <Switch disabled />
          </div>

          <Button disabled className="w-full">
            <Users className="mr-2 h-4 w-4" />
            Launch Referral Program
          </Button>
        </CardContent>
      </Card>

      {/* Automated Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Automated Workflows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Welcome Series</h4>
                <p className="text-sm text-muted-foreground">3-email sequence for new enrollments</p>
              </div>
              <Switch disabled />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Course Reminder</h4>
                <p className="text-sm text-muted-foreground">Remind students before classes</p>
              </div>
              <Switch disabled />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Completion Certificate</h4>
                <p className="text-sm text-muted-foreground">Auto-send certificates on completion</p>
              </div>
              <Switch disabled />
            </div>
          </div>

          <Button disabled className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Configure Workflows
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
