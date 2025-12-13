/**
 * Embeddings Service - Semantic Search for Legal Articles
 * Uses OpenAI text-embedding-3-small for cost-effective semantic search
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export interface EmbeddingResult {
  articleId: string
  similarity: number
  article: {
    number: string
    content: string
    legalCode: string
  }
}

/**
 * Generate embedding for a text query
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  })

  return response.data[0].embedding
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Search for similar articles using embeddings
 * This will be implemented after adding embedding column to database
 */
export async function searchSimilarArticles(
  query: string,
  legalCode: string,
  limit: number = 5
): Promise<EmbeddingResult[]> {
  // TODO: Implement after adding pgvector extension
  // For now, return empty array
  return []
}
