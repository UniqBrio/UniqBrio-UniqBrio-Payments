import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({}, { strict: false });

export default mongoose.models.Student || mongoose.model("Student", StudentSchema, "students");