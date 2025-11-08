import mongoose from 'mongoose';

const CohortSchema = new mongoose.Schema({
  cohortId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  courseName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Upcoming', 'Cancelled'],
    default: 'Active'
  },
  instructor: {
    type: String
  },
  maxStudents: {
    type: Number
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  students: [{
    studentId: String,
    studentName: String,
    enrollmentDate: Date
  }],
  schedule: {
    days: [String], // ['Monday', 'Wednesday', 'Friday']
    time: String, // '10:00 AM - 12:00 PM'
    timezone: String
  },
  location: {
    type: String // 'Online', 'Campus A', 'Hybrid', etc.
  },
  description: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'cohorts'
});

// Index for efficient querying
CohortSchema.index({ courseId: 1, status: 1 });
CohortSchema.index({ startDate: 1 });

// Virtual for active students count
CohortSchema.virtual('activeStudentsCount').get(function() {
  return this.students ? this.students.length : 0;
});

const Cohort = mongoose.models.Cohort || mongoose.model('Cohort', CohortSchema);

export default Cohort;
