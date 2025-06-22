import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { IceReport } from "@/lib/models/ice-report"

export async function GET() {
  console.log("🍃 ICE Reports API called")

  try {
    console.log("🔌 Connecting to MongoDB...")
    await connectDB()
    console.log("✅ MongoDB connected")

    console.log("📊 Fetching reports from database...")
    const reports = await IceReport.find({})
      .sort({ date: -1 })
      .limit(100) // Limit to recent 100 reports
      .lean()

    console.log(`📋 Found ${reports.length} reports in database`)

    // Transform MongoDB documents to match expected format
    const transformedReports = reports.map((report) => ({
      id: report._id.toString(),
      lat: report.lat,
      lon: report.lon,
      city: report.city,
      date: report.date.toISOString(),
      description: report.description,
      verified: report.verified,
      source: "mongodb",
    }))

    console.log("✅ Transformed reports:", transformedReports)
    return NextResponse.json(transformedReports)
  } catch (error) {
    console.error("❌ Error fetching ICE reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()

    const body = await request.json()
    const { lat, lon, city, description } = body

    if (!lat || !lon || !city) {
      return NextResponse.json({ error: "Missing required fields: lat, lon, city" }, { status: 400 })
    }

    const newReport = new IceReport({
      lat: Number.parseFloat(lat),
      lon: Number.parseFloat(lon),
      city,
      description: description || null,
      date: new Date(),
      verified: false,
      reportedBy: "anonymous",
    })

    await newReport.save()

    return NextResponse.json({
      success: true,
      id: newReport._id.toString(),
    })
  } catch (error) {
    console.error("Error creating ICE report:", error)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}
