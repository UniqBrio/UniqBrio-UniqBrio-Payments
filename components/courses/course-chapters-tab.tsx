"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Edit, Trash2, Upload, FileText, Video, Clock, Users, CheckCircle } from "lucide-react"

interface Chapter {
  id: string
  title: string
  description: string
  duration: string
  type: "video" | "text" | "quiz" | "assignment"
  status: "draft" | "published" | "archived"
  order: number
}

const sampleChapters: Chapter[] = [
  {
    id: "CH001",
    title: "Introduction to React",
    description: "Learn the fundamentals of React including components, JSX, and props",
    duration: "45 min",
    type: "video",
    status: "published",
    order: 1,
  },
  {
    id: "CH002",
    title: "State and Props",
    description: "Understanding state management and prop passing in React applications",
    duration: "60 min",
    type: "video",
    status: "published",
    order: 2,
  },
  {
    id: "CH003",
    title: "Hooks Deep Dive",
    description: "Master React hooks including useState, useEffect, and custom hooks",
    duration: "90 min",
    type: "video",
    status: "draft",
    order: 3,
  },
]

export function CourseChaptersTab() {
  const [chapters, setChapters] = useState<Chapter[]>(sampleChapters)
  const [isAddingChapter, setIsAddingChapter] = useState(false)
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    duration: "",
    type: "video" as Chapter["type"],
  })

  const handleAddChapter = () => {
    const chapter: Chapter = {
      id: `CH${Date.now()}`,
      ...newChapter,
      status: "draft",
      order: chapters.length + 1,
    }
    setChapters([...chapters, chapter])
    setNewChapter({ title: "", description: "", duration: "", type: "video" })
    setIsAddingChapter(false)
  }

  const handleDeleteChapter = (id: string) => {
    setChapters(chapters.filter((ch) => ch.id !== id))
  }

  const getTypeIcon = (type: Chapter["type"]) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      case "quiz":
        return <CheckCircle className="h-4 w-4" />
      case "assignment":
        return <Edit className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Chapter["status"]) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Chapter Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chapters</p>
                <p className="text-2xl font-bold">{chapters.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {chapters.filter((ch) => ch.status === "published").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold">
                  {chapters.reduce((total, ch) => {
                    const minutes = Number.parseInt(ch.duration) || 0
                    return total + minutes
                  }, 0)}{" "}
                  min
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-orange-600">87%</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Chapter Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Course Chapters</h3>
        <Button onClick={() => setIsAddingChapter(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      {/* Add Chapter Form */}
      {isAddingChapter && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Chapter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chapterTitle">Chapter Title</Label>
                <Input
                  id="chapterTitle"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                  placeholder="Enter chapter title"
                />
              </div>
              <div>
                <Label htmlFor="chapterDuration">Duration (minutes)</Label>
                <Input
                  id="chapterDuration"
                  type="number"
                  value={newChapter.duration}
                  onChange={(e) => setNewChapter({ ...newChapter, duration: e.target.value })}
                  placeholder="45"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="chapterType">Chapter Type</Label>
              <select
                id="chapterType"
                value={newChapter.type}
                onChange={(e) => setNewChapter({ ...newChapter, type: e.target.value as Chapter["type"] })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="video">Video Lesson</option>
                <option value="text">Text Content</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>

            <div>
              <Label htmlFor="chapterDescription">Description</Label>
              <Textarea
                id="chapterDescription"
                value={newChapter.description}
                onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                placeholder="Describe what students will learn in this chapter"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddChapter}>Add Chapter</Button>
              <Button variant="outline" onClick={() => setIsAddingChapter(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapters List */}
      <div className="space-y-4">
        {chapters.map((chapter, index) => (
          <Card key={chapter.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2 py-1 rounded">
                      Chapter {chapter.order}
                    </span>
                    {getTypeIcon(chapter.type)}
                    <h4 className="font-semibold text-lg">{chapter.title}</h4>
                    <Badge className={getStatusColor(chapter.status)}>{chapter.status}</Badge>
                  </div>

                  <p className="text-gray-600 mb-3">{chapter.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {chapter.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      {getTypeIcon(chapter.type)}
                      {chapter.type}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Content
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChapter(chapter.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chapters.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No chapters yet</h3>
            <p className="text-gray-500 mb-4">Start building your course by adding the first chapter.</p>
            <Button onClick={() => setIsAddingChapter(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Chapter
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
