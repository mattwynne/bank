import { TransactionReader } from "./ports/transaction-reader"
import { TransactionCategorizer } from "./ports/transaction-categorizer"
import { TransactionWriter } from "./ports/transaction-writer"

export class Processor {
  constructor(
    private readonly transactionReader: TransactionReader,
    private readonly transactionCategorizer: TransactionCategorizer,
    private readonly transactionWriter: TransactionWriter
  ) {}

  async process(): Promise<void> {
    const transactions = await this.transactionReader.readTransactions()
    const categorizedTransactions =
      await this.transactionCategorizer.categorize(transactions)
    await this.transactionWriter.writeTransactions(categorizedTransactions)
  }
}
