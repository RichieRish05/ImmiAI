// app/api/report/route.ts
import { connectDB } from "@/lib/db"
import Report from "@/models/Report"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await connectDB()
    const report = await Report.create(body)
    return NextResponse.json(report, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}
