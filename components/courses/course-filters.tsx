"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface CourseFiltersProps {
  onFiltersChange: (filters: any) => void
}

export function CourseFilters({ onFiltersChange }: CourseFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium">Course Level</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="beginner" />
              <Label htmlFor="beginner">Beginner</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="intermediate" />
              <Label htmlFor="intermediate">Intermediate</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="advanced" />
              <Label htmlFor="advanced">Advanced</Label>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Course Type</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="online" />
              <Label htmlFor="online">Online</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="offline" />
              <Label htmlFor="offline">Offline</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="hybrid" />
              <Label htmlFor="hybrid">Hybrid</Label>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Price Range (INR)</Label>
          <div className="mt-2">
            <Slider defaultValue={[0, 50000]} max={100000} step={1000} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>₹0</span>
              <span>₹1,00,000</span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Status</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="active" />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="draft" />
              <Label htmlFor="draft">Draft</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="archived" />
              <Label htmlFor="archived">Archived</Label>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={() => onFiltersChange({})}>
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}
