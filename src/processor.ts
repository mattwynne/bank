import { TransactionReader } from "./ports/transaction-reader"
import { TransactionCategorizer } from "./ports/transaction-categorizer"
import { TransactionWriter } from "./ports/transaction-writer"
import { BankTransaction } from "./domain/bank-transaction"
import { Category } from "./domain/category"

export class Processor {
  constructor(
    private readonly transactionReader: TransactionReader,
    private readonly transactionCategorizers: TransactionCategorizer[],
    private readonly transactionWriter: TransactionWriter
  ) {
    if (transactionCategorizers.length === 0) {
      throw new Error("At least one transaction categorizer is required")
    }
  }

  async process(): Promise<void> {
    const transactions = await this.transactionReader.readTransactions()

    const groups = this.groupTransactionsByTokens(transactions)
    const categorizedTransactions: BankTransaction[] = []

    for (const group of groups) {
      // Get tokens from the first transaction in the group (all have same tokens)
      const tokens = group[0].tokens()
      console.log(group)

      // Ask all categorizers for their opinion
      const categoryPromises = this.transactionCategorizers.map((categorizer) =>
        categorizer.categorizeByTokens(tokens)
      )
      const categoryNames = await Promise.all(categoryPromises)

      // Determine the final category name
      const finalCategoryName = this.determineFinalCategory(categoryNames)
      const category = new Category(finalCategoryName)

      // Apply the category to all transactions in the group
      const categorizedGroup = group.map((transaction) =>
        transaction.withCategory(category)
      )

      categorizedTransactions.push(...categorizedGroup)
    }

    await this.transactionWriter.writeTransactions(categorizedTransactions)
  }

  private determineFinalCategory(categoryNames: string[]): string {
    // Remove duplicates and get unique category names
    const uniqueCategories = [...new Set(categoryNames)]

    // If all categorizers agree, use that category
    if (uniqueCategories.length === 1) {
      return uniqueCategories[0]
    }

    // If they disagree, create a combined category name
    return uniqueCategories.join(" or ")
  }

  private groupTransactionsByTokens(
    transactions: BankTransaction[]
  ): BankTransaction[][] {
    const groups = new Map<string, BankTransaction[]>()

    for (const transaction of transactions) {
      const tokens = transaction.tokens()
      const key = tokens.sort().join("|")

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(transaction)
    }

    return Array.from(groups.values())
  }
}
