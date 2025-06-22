import { TransactionCategorizer } from "../ports/transaction-categorizer"
import { BankTransaction } from "../domain/bank-transaction"
import { Category } from "../domain/category"

export class OpenAiTransactionCategorizer implements TransactionCategorizer {
  constructor(private readonly openAiClient: any) {}

  async categorize(
    transactions: BankTransaction[]
  ): Promise<BankTransaction[]> {
    const prompt = this.buildPrompt(transactions)

    const response = await this.openAiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
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

    const categories = this.parseResponse(response.choices[0].message.content)

    return transactions.map((transaction, index) =>
      transaction.withCategory(new Category(categories[index]))
    )
  }

  private buildSystemPrompt(): string {
    return `You are a financial transaction categorizer. Your job is to categorize bank transactions into appropriate spending categories.

Please categorize each transaction and respond with a JSON array containing objects with a "category" field.

Common categories include:
- Food & Dining
- Groceries  
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Travel
- Income
- Transfer
- Other

Return your response as a JSON array in the exact same order as the transactions provided. Each object should have a "category" field with the category name.`
  }

  private buildPrompt(transactions: BankTransaction[]): string {
    const transactionList = transactions
      .map((transaction, index) => {
        const formattedDate = transaction.date.toISOString().split("T")[0]
        const formattedAmount =
          transaction.amount < 0
            ? `-$${Math.abs(transaction.amount).toFixed(2)}`
            : `$${transaction.amount.toFixed(2)}`

        return `${index + 1}. ${formattedDate}, "${
          transaction.description
        }", ${formattedAmount}`
      })
      .join("\n")

    return `Categorize these bank transactions:\n\n${transactionList}\n\nRespond with a JSON array of category objects.`
  }

  private parseResponse(responseContent: string): string[] {
    try {
      const parsed = JSON.parse(responseContent)
      return parsed.map((item: any) => item.category)
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${responseContent}`)
    }
  }
}
