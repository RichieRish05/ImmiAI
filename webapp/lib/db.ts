import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) throw new Error("MONGODB_URI not defined in .env")

const cached = (global as any).mongoose || { conn: null }

export async function connectDB() {
  if (cached.conn) return cached.conn
  cached.conn = await mongoose.connect(MONGODB_URI)
  return cached.conn
}
