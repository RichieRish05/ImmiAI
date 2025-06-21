import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { Pinecone } from "@pinecone-database/pinecone"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Initialize Pinecone with error handling
let pinecone: Pinecone | null = null
let index: any = null

try {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  index = pinecone.index("hack-test")
} catch (error) {
  console.error("Failed to initialize Pinecone:", error)
}

// Function to get embeddings from OpenAI
async function getEmbedding(text: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small",
        dimensions: 512,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error("Error getting embedding:", error)
    throw error
  }
}

// Function to retrieve relevant context from Pinecone
async function retrieveContext(query: string): Promise<{ context: string; sources: string[] }> {
  // If Pinecone is not available, return empty context
  if (!pinecone || !index) {
    console.log("🔍 Pinecone not available, skipping RAG retrieval")
    return { context: "", sources: [] }
  }

  try {
    // Validate environment variables
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      console.log("🔍 Missing Pinecone environment variables")
      return { context: "", sources: [] }
    }

    console.log("🔍 Retrieving context from Pinecone for query:", query.substring(0, 50) + "...")

    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query)

    // Search Pinecone for similar vectors with timeout
    const searchPromise = index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    })

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Pinecone query timeout")), 10000)
    })

    const searchResults = await Promise.race([searchPromise, timeoutPromise])

    // Extract context and source IDs (only use sources with similarity > 0.7)
    const contexts: string[] = []
    const sources: string[] = []

    searchResults.matches?.forEach((match) => {
      if (match.metadata?.text && match.score && match.score > 0.7) {
        contexts.push(match.metadata.text)
        sources.push(match.id)
      }
    })

    console.log(`✅ Retrieved ${contexts.length} relevant contexts from Pinecone (filtered by >0.7 similarity)`)
    return {
      context: contexts.join("\n\n"),
      sources: sources,
    }
  } catch (error) {
    console.error("❌ Error retrieving context from Pinecone:", error)
    // Return empty context instead of failing the entire request
    return { context: "", sources: [] }
  }
}

// Fallback knowledge base for when Pinecone is unavailable
const fallbackKnowledge = `
IMMIGRATION RIGHTS KNOWLEDGE:

Basic Rights:
- You have the right to remain silent during any ICE encounter
- You have the right to an attorney during immigration proceedings
- You have rights regardless of your immigration status
- You do not have to answer questions about your immigration status

Home Visits:
- ICE cannot enter your home without a judicial warrant signed by a judge
- Administrative warrants are not sufficient for home entry
- You do not have to open the door unless they show a valid judicial warrant

Documents:
- You are not required to carry immigration documents at all times
- You do not have to show documents unless ICE has a warrant
- If you choose to show documents, only show immigration documents

Workplace Rights:
- ICE can conduct workplace raids
- You have the right to remain silent and ask for an attorney
- Do not run, as this may be seen as suspicious behavior
`

export async function POST(req: Request) {
  console.log("🚀 Chat API route called")

  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get the latest user message for RAG retrieval
    const latestMessage = messages[messages.length - 1]
    const userQuery = latestMessage?.content || ""

    // Try to retrieve relevant context from Pinecone, fallback to static knowledge
    let relevantContext = ""
    let sources: string[] = []
    let ragUsed = false

    try {
      const result = await retrieveContext(userQuery)
      relevantContext = result.context
      sources = result.sources
      if (relevantContext) {
        ragUsed = true
        console.log("✅ Successfully retrieved context from Pinecone")
      }
    } catch (error) {
      console.log("⚠️ Pinecone unavailable, using fallback knowledge")
    }

    // If no context from Pinecone and query seems immigration-related, use fallback
    if (!relevantContext && userQuery.toLowerCase().match(/(ice|immigration|rights|documents|warrant|attorney)/)) {
      relevantContext = fallbackKnowledge
      sources = ["fallback-kb"]
      ragUsed = true
    }

    // Enhanced system prompt with context
    const systemPromptWithContext = `You are a knowledgeable immigration rights assistant. Your role is to help immigrants understand their legal rights when encountering ICE (Immigration and Customs Enforcement) or other immigration authorities.

${
  relevantContext
    ? `RELEVANT CONTEXT FROM KNOWLEDGE BASE:
${relevantContext}

Use this context to provide more accurate and detailed responses when relevant.`
    : ""
}

Key principles to follow:
- Provide accurate, helpful information about constitutional rights
- Emphasize the right to remain silent and the right to an attorney
- Explain that people have rights regardless of immigration status
- Be supportive and non-judgmental
- Provide practical, actionable advice
- Remind users that this is general information, not legal advice
- Suggest contacting immigration attorneys for specific cases
- Be clear about what documents people are/aren't required to show
- Explain the difference between ICE, police, and other authorities

Always be compassionate, clear, and empowering while providing factual information about rights and procedures.

IMPORTANT: At the very end of your response, add a hidden sources marker like this:
[SOURCES:${sources.join(",")}]

This marker will be parsed by the frontend to show source tags.`

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPromptWithContext,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("❌ Error in chat API:", error)
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
