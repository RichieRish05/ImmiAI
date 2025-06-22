import { Resend } from "resend"
import { type NextRequest, NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoBase64, lawyerEmail, timestamp } = body

    if (!videoBase64 || !lawyerEmail) {
      return NextResponse.json({ error: "Missing required fields: videoBase64 and lawyerEmail" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error("RESEND_FROM_EMAIL not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Remove the data URL prefix if present (data:video/webm;base64,)
    const base64Content = videoBase64.replace(/^data:video\/[^;]+;base64,/, "")

    // Generate filename with timestamp
    const filename = `emergency-recording-${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}.webm`

    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [lawyerEmail],
      subject: "🚨 EMERGENCY: Immigration Rights Recording",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY RECORDING</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #dc2626; margin-top: 0;">Immigration Rights Emergency</h2>
            
            <p><strong>This is an automated emergency message from the Immigration Rights Assistant.</strong></p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <p><strong>Recording Details:</strong></p>
              <ul>
                <li><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</li>
                <li><strong>File:</strong> ${filename}</li>
                <li><strong>Type:</strong> Emergency video recording</li>
              </ul>
            </div>
            
            <p>A video recording has been attached to this email. This recording was initiated using the panic mode feature of the Immigration Rights Assistant app.</p>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ URGENT:</strong> Please review this recording immediately and take appropriate legal action if necessary.</p>
            </div>
            
            <h3>Immediate Actions to Consider:</h3>
            <ul>
              <li>Review the video recording for any rights violations</li>
              <li>Contact your client immediately if possible</li>
              <li>Document any evidence of misconduct</li>
              <li>Consider filing complaints with appropriate authorities</li>
              <li>Prepare for potential legal proceedings</li>
            </ul>
            
            <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>About this service:</strong> This email was sent automatically from the Immigration Rights Assistant app when a user activated panic mode. The app provides immigrants with information about their rights and emergency recording capabilities.</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">If you received this email in error, please contact the sender immediately.</p>
          </div>
          
          <div style="background-color: #374151; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Immigration Rights Assistant - Emergency Recording Service</p>
            <p style="margin: 5px 0 0 0;">Sent on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      attachments: [
        {
          content: base64Content,
          filename: filename,
          contentType: "video/webm",
        },
      ],
    })

    console.log("Emergency video email sent successfully:", emailResult.data?.id)

    return NextResponse.json({
      success: true,
      messageId: emailResult.data?.id,
      message: "Emergency video sent successfully",
    })
  } catch (error) {
    console.error("Error sending emergency video:", error)

    return NextResponse.json(
      {
        error: "Failed to send emergency video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
