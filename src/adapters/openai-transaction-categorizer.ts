import { TransactionCategorizer } from "../ports/transaction-categorizer"
import { BankTransaction } from "../domain/bank-transaction"
import { Category } from "../domain/category"
import { loadSystemPrompt } from "../utils/prompt-loader"

export class OpenAiTransactionCategorizer implements TransactionCategorizer {
  constructor(private readonly openAiClient: any) {}

  async categorizeByTokens(tokens: string[]): Promise<string> {
    const prompt = this.buildPrompt(tokens)

    const response = await this.openAiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: this.buildSystemPrompt(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
    })

    console.log([prompt, response.choices[0].message.content])
    const category = this.parseResponse(response.choices[0].message.content)

    return category
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
