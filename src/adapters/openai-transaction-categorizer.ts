import { TransactionCategorizer } from "../ports/transaction-categorizer"
import { BankTransaction } from "../domain/bank-transaction"
import { Category } from "../domain/category"

export class OpenAiTransactionCategorizer implements TransactionCategorizer {
  constructor(private readonly openAiClient: any) {}

  async categorizeByTokens(tokens: string[]): Promise<string> {
    const prompt = this.buildPrompt(tokens)

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

    console.log([prompt, response.choices[0].message.content])
    const category = this.parseResponse(response.choices[0].message.content)

    return category
  }

  private buildSystemPrompt(): string {
    return `You are a financial transaction categorizer. Your job is to categorize a group of similar bank transactions based on their description tokens.

You will receive a list of tokens extracted from transaction descriptions that represent a group of similar transactions.

Please respond with a single category name that best describes this group of transactions.

Suggested categories are:
- ATM Cash withdrawals
- E-Transfer payment  
- Internet banking transfer
- Mortgage
- Salary
- Investments
- Insurance
- Food & Dining
- Groceries  
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Health & Fitness
- Travel
- Other income
- Transfer
- Unknown

Note the following keywords that will help you categorize:
| Keywords | Category |
|----------|----------|
| Amy Farrish | Cleaning |
| Manulife | Healthcare |
| Wendee Byrne | Healthcare |
| Deel | Salary |g
| Eva Gifford | Sports, Health & Fitness |

Respond with only the category name, no additional text or formatting.`
  }

  private buildPrompt(tokens: string[]): string {
    return tokens.join(", ")
  }

  private parseResponse(responseContent: string): string {
    // Since we're now expecting just a category name, trim whitespace
    return responseContent.trim()
  }
}
