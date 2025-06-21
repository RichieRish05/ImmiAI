import { Pinecone } from "@pinecone-database/pinecone"

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

// Sample immigration rights data to populate the vector database
const immigrationData = [
  {
    id: "ice-rights-1",
    text: "During an ICE encounter, you have the right to remain silent. You do not have to answer questions about your immigration status, country of origin, or how you entered the United States. This right applies regardless of your actual immigration status.",
    metadata: { category: "rights", topic: "ice-encounter" },
  },
  {
    id: "ice-rights-2",
    text: "You have the right to an attorney during immigration proceedings. If you cannot afford an attorney, you have the right to ask for a list of free or low-cost legal services. You should never sign any documents without speaking to an attorney first.",
    metadata: { category: "rights", topic: "attorney" },
  },
  {
    id: "home-visits-1",
    text: "ICE agents cannot enter your home without a warrant signed by a judge. If ICE comes to your door, you do not have to let them in unless they show you a judicial warrant. Administrative warrants are not sufficient for home entry.",
    metadata: { category: "procedures", topic: "home-visits" },
  },
  {
    id: "documents-1",
    text: "You are not required to carry immigration documents with you at all times, and you do not have to show documents to ICE unless they have a warrant. However, if you choose to show documents, only show immigration documents, not other personal documents like social security cards.",
    metadata: { category: "documents", topic: "requirements" },
  },
  {
    id: "workplace-1",
    text: "ICE can conduct workplace raids and arrests. If ICE comes to your workplace, you have the right to remain silent and ask for an attorney. Do not run, as this may be seen as suspicious behavior.",
    metadata: { category: "procedures", topic: "workplace" },
  },
]

// Function to get embeddings from OpenAI
async function getEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
      dimensions: 1024,
    }),
  })

  const data = await response.json()
  return data.data[0].embedding
}

async function setupPineconeIndex() {
  try {
    const indexName = process.env.PINECONE_INDEX_NAME
    const indexUrl = process.env.PINECONE_INDEX_URL

    // Check if index exists, create if it doesn't
    const existingIndexes = await pinecone.listIndexes()

    if (!existingIndexes.indexes?.find((index) => index.name === indexName)) {
      console.log(`Creating index: ${indexName}`)
      await pinecone.createIndex({
        name: indexName,
        dimension: 1024, // Updated to match text-embedding-3-small with 1024 dimensions
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      })

      // Wait for index to be ready
      console.log("Waiting for index to be ready...")
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }

    // Use the index URL if provided, otherwise use just the name
    const index = indexUrl ? pinecone.index(indexName, indexUrl) : pinecone.index(indexName)

    // Generate embeddings and upsert data
    console.log("Generating embeddings and upserting data...")

    const vectors = await Promise.all(
      immigrationData.map(async (item) => {
        const embedding = await getEmbedding(item.text)
        return {
          id: item.id,
          values: embedding,
          metadata: {
            text: item.text,
            ...item.metadata,
          },
        }
      }),
    )

    await index.upsert(vectors)
    console.log("✅ Pinecone setup complete!")
  } catch (error) {
    console.error("❌ Error setting up Pinecone:", error)
  }
}

setupPineconeIndex()
