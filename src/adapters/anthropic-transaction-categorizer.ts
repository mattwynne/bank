import { TransactionCategorizer } from "../ports/transaction-categorizer"
import { BankTransaction } from "../domain/bank-transaction"
import { Category } from "../domain/category"
import Anthropic from "@anthropic-ai/sdk"
import { loadSystemPrompt } from "../utils/prompt-loader"

export class AnthropicTransactionCategorizer implements TransactionCategorizer {
  constructor(private readonly anthropicClient: Anthropic) {}

  async categorizeByTokens(tokens: string[]): Promise<string> {
    const prompt = this.buildPrompt(tokens)

    const response = await this.anthropicClient.messages.create({
      model: "claude-4-sonnet-20250514",
      max_tokens: 50,
      temperature: 0.1,
      system: this.buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const textContent = response.content[0]
    if (textContent.type === "text") {
      console.log([prompt, textContent.text])
      const category = this.parseResponse(textContent.text)
      return category
    } else {
      throw new Error("Expected text response from Anthropic API")
    }
  }

  private buildSystemPrompt(): string {
    return loadSystemPrompt()
  }

  private buildPrompt(tokens: string[]): string {
    return tokens.join(", ")
  }

  private parseResponse(responseContent: string): string {
    // Since we're now expecting just a category name, trim whitespace
    return responseContent.trim()
  }
}
