import { Processor } from "./processor"
import { CsvTransactionReader } from "./adapters/csv-transaction-reader"
import { OpenAiTransactionCategorizer } from "./adapters/openai-transaction-categorizer"
import { CsvTransactionWriter } from "./adapters/csv-transaction-writer"
import OpenAI from "openai"

export interface ApplicationConfig {
  inputFilePath: string
  outputFilePath: string
  openAiApiKey: string
}

export class Application {
  constructor(private readonly config: ApplicationConfig) {}

  async run(): Promise<void> {
    console.log(`Processing transactions from ${this.config.inputFilePath}...`)

    // Create OpenAI client
    const openAiClient = new OpenAI({
      apiKey: this.config.openAiApiKey,
    })

    // Create adapters
    const reader = new CsvTransactionReader(this.config.inputFilePath)
    const categorizer = new OpenAiTransactionCategorizer(openAiClient)
    const writer = new CsvTransactionWriter(this.config.outputFilePath)

    // Create and run processor
    const processor = new Processor(reader, categorizer, writer)

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
