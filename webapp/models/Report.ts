// models/Report.ts
import mongoose from "mongoose"

const ReportSchema = new mongoose.Schema({
  lat: Number,
  lon: Number,
  city: String,
  date: String,
  description: String,
  likes: {
    type: Number,
    default: 0,
  },
})

export default mongoose.models.Report || mongoose.model("Report", ReportSchema)
