import { TransactionReader } from "./ports/transaction-reader"
import { TransactionCategorizer } from "./ports/transaction-categorizer"
import { TransactionWriter } from "./ports/transaction-writer"
import { BankTransaction } from "./domain/bank-transaction"
import { Category } from "./domain/category"

export class Processor {
  constructor(
    private readonly transactionReader: TransactionReader,
    private readonly transactionCategorizer: TransactionCategorizer,
    private readonly transactionWriter: TransactionWriter
  ) {}

  async process(): Promise<void> {
    const transactions = await this.transactionReader.readTransactions()

    const groups = this.groupTransactionsByTokens(transactions)
    const categorizedTransactions: BankTransaction[] = []

    for (const group of groups) {
      // Get tokens from the first transaction in the group (all have same tokens)
      const tokens = group[0].tokens()
      console.log(group)
      const categoryName = await this.transactionCategorizer.categorizeByTokens(
        tokens
      )
      const category = new Category(categoryName)

      // Apply the category to all transactions in the group
      const categorizedGroup = group.map((transaction) =>
        transaction.withCategory(category)
      )

      categorizedTransactions.push(...categorizedGroup)
    }

    await this.transactionWriter.writeTransactions(categorizedTransactions)
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
