import { Processor } from "./processor"
import { CsvTransactionReader } from "./adapters/csv-transaction-reader"
import { OpenAiTransactionCategorizer } from "./adapters/openai-transaction-categorizer"
import { AnthropicTransactionCategorizer } from "./adapters/anthropic-transaction-categorizer"
import { CsvTransactionWriter } from "./adapters/csv-transaction-writer"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export interface ApplicationConfig {
  inputFilePath: string
  outputFilePath: string
  openAiApiKey: string
  anthropicApiKey: string
}

export class Application {
  constructor(private readonly config: ApplicationConfig) {}

  async run(): Promise<void> {
    console.log(`Processing transactions from ${this.config.inputFilePath}...`)

    // Create AI clients
    const openAiClient = new OpenAI({
      apiKey: this.config.openAiApiKey,
    })

    const anthropicClient = new Anthropic({
      apiKey: this.config.anthropicApiKey,
    })

    // Create adapters
    const reader = new CsvTransactionReader(this.config.inputFilePath)

    // Create a mix of OpenAI and Anthropic categorizers
    const categorizers = [
      ...Array(1)
        .fill(null)
        .map(() => new OpenAiTransactionCategorizer(openAiClient)),
      ...Array(2)
        .fill(null)
        .map(() => new AnthropicTransactionCategorizer(anthropicClient)),
    ]

    const writer = new CsvTransactionWriter(this.config.outputFilePath)

    // Create and run processor
    const processor = new Processor(reader, categorizers, writer)

    await processor.process()

    console.log(
      `Categorized transactions written to ${this.config.outputFilePath}`
    )
  }
}

// Factory function for easier usage
export function createApplication(config: ApplicationConfig): Application {
  return new Application(config)
}

// Main entry point function
export async function processTransactions(
  config: ApplicationConfig
): Promise<void> {
  const app = createApplication(config)
  await app.run()
}
