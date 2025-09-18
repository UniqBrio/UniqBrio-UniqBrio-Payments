"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Search, Bell, Settings, User, Star, Menu, ChevronDown, 
  LayoutGrid, List, Filter, Upload, Download, Plus, ArrowUpDown, X 
} from "lucide-react"

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
            {!sidebarCollapsed && <span className="font-semibold">Dashboard</span>}
          </div>
        </div>
        
        <div className="px-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search..." className="pl-10 h-10" />
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-gray-400" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Favorites</span>}
          </div>
        </div>

        <nav className="px-4">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutGrid className="h-4 w-4" />
              {!sidebarCollapsed && "Dashboard"}
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {!sidebarCollapsed && "Users"}
              </div>
              {!sidebarCollapsed && <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </nav>

        <div className="absolute bottom-4 left-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10 relative flex-1" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search..." className="pl-10" />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex">
                <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")} className="rounded-r-none">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="rounded-l-none">
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm"><Filter className="h-4 w-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filters</h4>
                    <Input placeholder="Filter by name..." />
                  </div>
                </PopoverContent>
              </Popover>

              <Select>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm"><Upload className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm"><Download className="h-4 w-4" /></Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="rounded-lg border shadow-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl font-semibold">1,234</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-sm text-gray-600">Total Users</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="mb-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Chart</CardTitle></CardHeader>
                <CardContent><div className="h-64 bg-purple-50 rounded flex items-center justify-center">Chart Area</div></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Enter text..." className="h-10 rounded-md border px-3 py-2 focus-visible:ring-2 placeholder:text-muted-foreground" />
            <div className="flex gap-2">
              <Button className="focus:ring-2">Save</Button>
              <Button variant="outline" className="focus:ring-2">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}