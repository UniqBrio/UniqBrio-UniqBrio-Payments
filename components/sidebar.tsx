"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Home,
  Briefcase,
  Calendar,
  BookOpen,
  ClipboardCheck,
  Users,
  UserCog,
  MessageSquare,
  CreditCard,
  TrendingUp,
  CalendarClock,
  Users2,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  UserPlus,
  Palette,
  LayoutGrid,
  Star,
  DollarSign,
  BarChart3,
  PieChart,
  FileText,
  TrendingDown,
  GraduationCap,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  UserCircle,
  Move,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useSidebarPosition } from "@/contexts/sidebar-position-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface SidebarProps {
  position: "left" | "right" | "top" | "bottom"
  collapsed: boolean
  toggleSidebar: () => void
}

interface MenuItem {
  id: string
  name: string
  icon: React.ReactNode
  href: string
  tooltip: string
  submenu?: MenuItem[]
  isFavorite?: boolean
}

export default function Sidebar({ position, collapsed, toggleSidebar }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([])
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const favoritesRef = useRef<HTMLDivElement>(null)
  const { setPosition } = useSidebarPosition()

  // Define all menu items
  const menuItems: MenuItem[] = [
    {
      id: "home",
      name: "Home",
      icon: <Home className="h-5 w-5" />,
      href: "/",
      tooltip: "Go to home page with ROI filters",
    },
    {
      id: "services",
      name: "Services",
      icon: <Briefcase className="h-5 w-5" />,
      href: "/services",
      tooltip: "Manage services",
      submenu: [
        {
          id: "schedule",
          name: "Schedule",
          icon: <Calendar className="h-5 w-5" />,
          href: "/services/schedule",
          tooltip: "View and manage schedules",
        },
        {
          id: "courses",
          name: "Course Management",
          icon: <BookOpen className="h-5 w-5" />,
          href: "/services/courses",
          tooltip: "Manage courses",
        },
      ],
    },
    {
      id: "user",
      name: "User Management",
      icon: <UserCircle className="h-5 w-5" />,
      href: "/user",
      tooltip: "Manage users",
      submenu: [
        {
          id: "students",
          name: "Students Management",
          icon: <Users className="h-5 w-5" />,
          href: "/user/students",
          tooltip: "Manage students",
        },
        {
          id: "staff",
          name: "Staff Management",
          icon: <UserCog className="h-5 w-5" />,
          href: "/user/staff",
          tooltip: "Manage staff",
          submenu: [
            {
              id: "instructor",
              name: "Instructor",
              icon: <Users className="h-5 w-5" />,
              href: "/user/staff/instructor",
              tooltip: "Manage instructors",
            },
            {
              id: "non-instructor",
              name: "Non-Instructor",
              icon: <Users className="h-5 w-5" />,
              href: "/user/staff/non-instructor",
              tooltip: "Manage non-instructors",
            },
            {
              id: "leave",
              name: "Leave Management",
              icon: <Calendar className="h-5 w-5" />,
              href: "/user/staff/leave",
              tooltip: "Manage leave requests",
            },
            {
              id: "attendance",
              name: "Attendance",
              icon: <ClipboardCheck className="h-5 w-5" />,
              href: "/user/staff/attendance",
              tooltip: "Track attendance",
            },
          ],
        },
        {
          id: "parents",
          name: "Parent Management",
          icon: <UserPlus className="h-5 w-5" />,
          href: "/user/parents",
          tooltip: "Manage parents",
        },
        {
          id: "alumni",
          name: "Alumni Management",
          icon: <GraduationCap className="h-5 w-5" />,
          href: "/user/alumni",
          tooltip: "Manage alumni",
        },
      ],
    },
    {
      id: "enquiries",
      name: "Enquiries",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/enquiries",
      tooltip: "Handle enquiries",
    },
    {
      id: "register-student",
      name: "Register Student",
      icon: <UserPlus className="h-5 w-5" />,
      href: "/register",
      tooltip: "Register new student with automatic payment setup",
    },
    {
      id: "Payments",
      name: "Payments",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/payments",
      tooltip: "Process payments",
    },
    {
      id: "financials",
      name: "Financials",
      icon: <DollarSign className="h-5 w-5" />,
      href: "/financials",
      tooltip: "Financial management",
      submenu: [
        {
          id: "income",
          name: "Income",
          icon: <BarChart3 className="h-5 w-5" />,
          href: "/financials/income",
          tooltip: "Manage income",
        },
        {
          id: "expenses",
          name: "Expenses",
          icon: <TrendingDown className="h-5 w-5" />,
          href: "/financials/expenses",
          tooltip: "Manage expenses",
        },
        {
          id: "roi",
          name: "ROI",
          icon: <PieChart className="h-5 w-5" />,
          href: "/financials/roi",
          tooltip: "Return on investment with filter options",
        },
        {
          id: "balance-sheet",
          name: "Balance Sheet",
          icon: <FileText className="h-5 w-5" />,
          href: "/financials/balance-sheet",
          tooltip: "View balance sheet",
        },
        {
          id: "forecast",
          name: "Forecast",
          icon: <TrendingUp className="h-5 w-5" />,
          href: "/financials/forecast",
          tooltip: "Financial forecasting with filter options",
        },
      ],
    },
    {
      id: "promotion",
      name: "Promotion",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/promotion",
      tooltip: "Manage promotions",
    },
    {
      id: "events",
      name: "Events",
      icon: <CalendarClock className="h-5 w-5" />,
      href: "/events",
      tooltip: "Manage events",
    },
    {
      id: "community",
      name: "Community",
      icon: <Users2 className="h-5 w-5" />,
      href: "https://dailybriopulse.com",
      tooltip: "Community engagement",
    },
    {
      id: "settings",
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      tooltip: "Application settings",
      submenu: [
        {
          id: "theme",
          name: "Theme Customization",
          icon: <Palette className="h-5 w-5" />,
          href: "/settings/theme",
          tooltip: "Customize application theme",
        },
        {
          id: "display",
          name: "Display Options",
          icon: <LayoutGrid className="h-5 w-5" />,
          href: "/settings/display",
          tooltip: "Configure display options",
        },
        {
          id: "favourites",
          name: "Favourites",
          icon: <Star className="h-5 w-5" />,
          href: "/settings/favourites",
          tooltip: "Manage favourite menu items",
        },
      ],
    },
    {
      id: "audit-logs",
      name: "Audit logs",
      icon: <FileText className="h-5 w-5" />,
      href: "/audit-logs",
      tooltip: "View audit logs",
    },
    {
      id: "help",
      name: "Help",
      icon: <HelpCircle className="h-5 w-5" />,
      href: "/help",
      tooltip: "Get help",
    },
  ]

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Update filtered menu items when search term changes
  useEffect(() => {
    let items = [...menuItems]

    // Mark items as favorites based on the favorites array
    items = items.map((item) => {
      const newItem = { ...item, isFavorite: favorites.includes(item.id) }
      if (item.submenu) {
        newItem.submenu = item.submenu.map((subitem) => ({
          ...subitem,
          isFavorite: favorites.includes(subitem.id),
          submenu: subitem.submenu
            ? subitem.submenu.map((subsubitem) => ({
                ...subsubitem,
                isFavorite: favorites.includes(subsubitem.id),
              }))
            : undefined,
        }))
      }
      return newItem
    })

    // Filter by search term if provided
    if (searchTerm.trim() !== "") {
      const searchResults: MenuItem[] = []

      // Helper function to search through menu items and their submenus
      const searchMenuItems = (menuItems: MenuItem[], parentItem?: MenuItem) => {
        menuItems.forEach((item) => {
          const matchesItem = item.name.toLowerCase().includes(searchTerm.toLowerCase())

          // Check if any submenu items match
          const matchingSubItems: MenuItem[] = []
          if (item.submenu) {
            item.submenu.forEach((subitem) => {
              const matchesSubItem = subitem.name.toLowerCase().includes(searchTerm.toLowerCase())

              // Check if any sub-submenu items match
              const matchingSubSubItems: MenuItem[] = []
              if (subitem.submenu) {
                subitem.submenu.forEach((subsubitem) => {
                  if (subsubitem.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    matchingSubSubItems.push(subsubitem)
                  }
                })
              }

              if (matchesSubItem || matchingSubSubItems.length > 0) {
                // If submenu or its children match, add a copy with only matching children
                const subitemCopy = { ...subitem }
                if (matchingSubSubItems.length > 0) {
                  subitemCopy.submenu = matchingSubSubItems
                }
                matchingSubItems.push(subitemCopy)
              }
            })
          }

          if (matchesItem || matchingSubItems.length > 0) {
            // If item or its children match, add a copy with only matching children
            const itemCopy = { ...item }
            if (matchingSubItems.length > 0) {
              itemCopy.submenu = matchingSubItems
            }
            searchResults.push(itemCopy)

            // Open the submenu if it contains matches
            if (matchingSubItems.length > 0 && !openSubmenus.includes(item.id)) {
              setOpenSubmenus((prev) => [...prev, item.id])
            }

            // Open parent submenu if this is a matching child
            if (parentItem && !openSubmenus.includes(parentItem.id)) {
              setOpenSubmenus((prev) => [...prev, parentItem.id])
            }
          }
        })
      }

      searchMenuItems(items)
      items = searchResults
    }

    setFilteredMenuItems(items)
  }, [searchTerm, favorites, openSubmenus])

  // Close favorites dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setFavoritesOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleSubmenu = (name: string) => {
    setOpenSubmenus((prev) => {
      if (prev.includes(name)) {
        return prev.filter((item) => item !== name)
      } else {
        return [...prev, name]
      }
    })
  }

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]

      // Save to localStorage
      localStorage.setItem("favorites", JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  // Get all favorite menu items
  const getFavoriteItems = () => {
    const favoriteItems: MenuItem[] = []

    const collectFavorites = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (favorites.includes(item.id)) {
          favoriteItems.push({ ...item, submenu: undefined })
        }

        if (item.submenu) {
          collectFavorites(item.submenu)
        }
      })
    }

    collectFavorites(menuItems)
    return favoriteItems
  }

  // Get the appropriate collapse icon based on sidebar position
  const getCollapseIcon = () => {
    if (collapsed) {
      switch (position) {
        case "left":
          return <ChevronRight className="h-5 w-5" />
        case "right":
          return <ChevronLeft className="h-5 w-5" />
        case "top":
          return <ChevronDown className="h-5 w-5" />
        case "bottom":
          return <ChevronUp className="h-5 w-5" />
      }
    } else {
      switch (position) {
        case "left":
          return <ChevronLeft className="h-5 w-5" />
        case "right":
          return <ChevronRight className="h-5 w-5" />
        case "top":
          return <ChevronUp className="h-5 w-5" />
        case "bottom":
          return <ChevronDown className="h-5 w-5" />
      }
    }
  }

  // Determine sidebar classes based on position and collapsed state
  const getSidebarClasses = () => {
    const baseClasses = "bg-white border-gray-200 transition-all duration-300 ease-in-out z-20 flex"

    switch (position) {
      case "left":
        return cn(baseClasses, "border-r h-screen flex-col", collapsed ? "w-[70px]" : "w-[250px]")
      case "right":
        return cn(baseClasses, "border-l h-screen flex-col", collapsed ? "w-[70px]" : "w-[250px]")
      case "top":
        return cn(baseClasses, "border-b w-full flex-row", collapsed ? "h-[60px]" : "h-[200px]")
      case "bottom":
        return cn(baseClasses, "border-t w-full flex-row", collapsed ? "h-[60px]" : "h-[200px]")
      default:
        return baseClasses
    }
  }

  // Determine if sidebar is horizontal (top or bottom)
  const isHorizontal = position === "top" || position === "bottom"

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isOpen = openSubmenus.includes(item.id)
    const isFavorite = favorites.includes(item.id)

    return (
      <div key={item.id} className={level > 0 ? "ml-4" : ""}>
        {hasSubmenu ? (
          <Collapsible open={collapsed ? false : isOpen} onOpenChange={() => !collapsed && toggleSubmenu(item.id)}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "flex items-center w-full px-2 py-2 text-sm font-medium rounded-md hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors",
                    collapsed ? "justify-center" : "justify-between",
                  )}
                >
                  <div className="flex items-center">
                    <span className="text-gray-500">{item.icon}</span>
                    {!collapsed && <span className="text-left ml-3">{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6 mr-1", isFavorite ? "text-orange-500" : "text-gray-400")}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(item.id)
                          }}
                          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={cn("h-4 w-4", isFavorite ? "fill-orange-500" : "")} />
                        </Button>
                        <ChevronDown
                          className={cn("h-4 w-4 text-gray-500 transition-transform", isOpen && "transform rotate-180")}
                        />
                      </div>
                    </>
                  )}
                </CollapsibleTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-purple-700 text-white">
                  {item.tooltip}
                </TooltipContent>
              )}
            </Tooltip>
            {!collapsed && (
              <CollapsibleContent className="space-y-1 mt-1">
                {item.submenu?.map((subitem) => renderMenuItem(subitem, level + 1))}
              </CollapsibleContent>
            )}
          </Collapsible>
        ) : (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors",
                    collapsed ? "justify-center w-full" : "justify-start flex-1",
                  )}
                >
                  <span className="text-gray-500">{item.icon}</span>
                  {!collapsed && <span className="text-left ml-3">{item.name}</span>}
                </Link>
                {!collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6 mr-1", isFavorite ? "text-orange-500" : "text-gray-400")}
                    onClick={() => toggleFavorite(item.id)}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star className={cn("h-4 w-4", isFavorite ? "fill-orange-500" : "")} />
                  </Button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-purple-700 text-white">
              {item.tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  }

  // Render horizontal sidebar content (for top/bottom positions)
  const renderHorizontalContent = () => {
    if (collapsed) {
      return (
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Move className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("left")}
                        className="h-10 w-10"
                        aria-label="Position sidebar left"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Left</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("right")}
                        className="h-10 w-10"
                        aria-label="Position sidebar right"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">Right</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("top")}
                        className="h-10 w-10"
                        aria-label="Position sidebar top"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Top</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("bottom")}
                        className="h-10 w-10"
                        aria-label="Position sidebar bottom"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Bottom</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sidebar position</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {getCollapseIcon()}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full w-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Move className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("left")}
                        className="h-10 w-10 flex flex-col items-center justify-center"
                        aria-label="Position sidebar left"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs mt-1">Left</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("right")}
                        className="h-10 w-10 flex flex-col items-center justify-center"
                        aria-label="Position sidebar right"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <span className="text-xs mt-1">Right</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("top")}
                        className="h-10 w-10 flex flex-col items-center justify-center"
                        aria-label="Position sidebar top"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="text-xs mt-1">Top</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPosition("bottom")}
                        className="h-10 w-10 flex flex-col items-center justify-center"
                        aria-label="Position sidebar bottom"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="text-xs mt-1">Bottom</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sidebar position</TooltipContent>
            </Tooltip>
            <div ref={favoritesRef} className="relative">
              <Popover open={favoritesOpen} onOpenChange={setFavoritesOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                    <span>⭐ Favourite Menu Items</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  {getFavoriteItems().length > 0 ? (
                    <div className="space-y-1">
                      {getFavoriteItems().map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-purple-50 hover:text-purple-700"
                        >
                          <span className="text-gray-500 mr-2">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2">No favorite items yet</div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search menu..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search menu items"
              />
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {getCollapseIcon()}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex flex-wrap gap-2">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="w-auto">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center bg-white border border-gray-200 rounded-md">
                      <Link
                        href={item.href}
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      >
                        <span className="text-gray-500 mr-2">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 mr-1",
                          favorites.includes(item.id) ? "text-orange-500" : "text-gray-400",
                        )}
                        onClick={() => toggleFavorite(item.id)}
                        aria-label={favorites.includes(item.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={cn("h-4 w-4", favorites.includes(item.id) ? "fill-orange-500" : "")} />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-purple-700 text-white">
                    {item.tooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render vertical sidebar content (for left/right positions)
  const renderVerticalContent = () => {
    return (
      <>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex-1"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {getCollapseIcon()}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search menu..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search menu items"
              />
            </div>
          </div>
        )}

        <div className="py-4 overflow-y-auto flex-1">
          {/* Favorites Dropdown */}
          {!collapsed && (
            <div className="px-4 mb-4" ref={favoritesRef}>
              <Popover open={favoritesOpen} onOpenChange={setFavoritesOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-2 fill-orange-500 text-orange-500" />
                      <span>⭐ Favourite Menu Items</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  {getFavoriteItems().length > 0 ? (
                    <div className="space-y-1">
                      {getFavoriteItems().map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-center px-2 py-2 text-sm rounded-md hover:bg-purple-50 hover:text-purple-700"
                        >
                          <span className="text-gray-500 mr-2">{item.icon}</span>
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2">No favorite items yet</div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Main Navigation */}
          <nav className="px-2 space-y-1">{filteredMenuItems.map((item) => renderMenuItem(item))}</nav>

          {/* Sidebar Position Selector - at the bottom */}
          {!collapsed && (
            <div className="px-4 mt-4 pt-4 border-t border-gray-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-full h-10">
                        <Move className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPosition("left")}
                          className="h-10 w-10 flex flex-col items-center justify-center"
                          aria-label="Position sidebar left"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span className="text-xs mt-1">Left</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPosition("right")}
                          className="h-10 w-10 flex flex-col items-center justify-center"
                          aria-label="Position sidebar right"
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span className="text-xs mt-1">Right</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPosition("top")}
                          className="h-10 w-10 flex flex-col items-center justify-center"
                          aria-label="Position sidebar top"
                        >
                          <ArrowUp className="h-4 w-4" />
                          <span className="text-xs mt-1">Top</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPosition("bottom")}
                          className="h-10 w-10 flex flex-col items-center justify-center"
                          aria-label="Position sidebar bottom"
                        >
                          <ArrowDown className="h-4 w-4" />
                          <span className="text-xs mt-1">Bottom</span>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent side="right">Sidebar position</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <TooltipProvider>
      <aside className={getSidebarClasses()}>
        {isHorizontal ? renderHorizontalContent() : renderVerticalContent()}
      </aside>
    </TooltipProvider>
  )
}
