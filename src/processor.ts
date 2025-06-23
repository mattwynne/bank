import { TransactionReader } from "./ports/transaction-reader"
import { TransactionCategorizer } from "./ports/transaction-categorizer"
import { TransactionWriter } from "./ports/transaction-writer"
import { BankTransaction } from "./domain/bank-transaction"

export class Processor {
  constructor(
    private readonly transactionReader: TransactionReader,
    private readonly transactionCategorizer: TransactionCategorizer,
    private readonly transactionWriter: TransactionWriter
  ) {}

  async process(): Promise<void> {
    const transactions = await this.transactionReader.readTransactions()

    const groups = this.groupTransactionsByTokens(transactions)
    const categorizedGroups = await Promise.all(
      groups.map((group) => this.transactionCategorizer.categorize(group))
    )
    const categorizedTransactions = categorizedGroups.reduce(
      (allTransactions, groupTransactions) =>
        allTransactions.concat(groupTransactions),
      []
    )

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
