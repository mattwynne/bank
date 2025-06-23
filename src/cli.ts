#!/usr/bin/env node

import { processTransactions } from "./application"

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error(
      "Usage: npm run categorize <input-file> <output-file> [batch-size]"
    )
    console.error(
      "Environment variables required: OPENAI_API_KEY, ANTHROPIC_API_KEY"
    )
    process.exit(1)
  }

  const inputFilePath = args[0]
  const outputFilePath = args[1]
  const openAiApiKey = process.env.OPENAI_API_KEY
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!openAiApiKey) {
    console.error("Error: OPENAI_API_KEY environment variable is required")
    process.exit(1)
  }

  if (!anthropicApiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required")
    process.exit(1)
  }

  try {
    await processTransactions({
      inputFilePath,
      outputFilePath,
      openAiApiKey,
      anthropicApiKey,
    })
  } catch (error) {
    console.error("Error processing transactions:", error)
    process.exit(1)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main()
}
