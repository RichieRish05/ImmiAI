import mongoose from "mongoose"

const IceReportSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    city: { type: String, required: true },
    date: { type: Date, required: true },
    description: { type: String, default: null },
    verified: { type: Boolean, default: false },
    reportedBy: { type: String, default: "anonymous" },
  },
  {
    timestamps: true,
  },
)

export const IceReport = mongoose.models.IceReport || mongoose.model("IceReport", IceReportSchema)

export type IceReportType = {
  _id: string
  lat: number
  lon: number
  city: string
  date: string
  description?: string
  verified: boolean
  reportedBy: string
  createdAt: string
  updatedAt: string
}
