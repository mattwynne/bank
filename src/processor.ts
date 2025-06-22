import { TransactionReader } from "./ports/transaction-reader"
import { TransactionCategorizer } from "./ports/transaction-categorizer"
import { TransactionWriter } from "./ports/transaction-writer"
import { BankTransaction } from "./domain/bank-transaction"

export class Processor {
  constructor(
    private readonly transactionReader: TransactionReader,
    private readonly transactionCategorizer: TransactionCategorizer,
    private readonly transactionWriter: TransactionWriter,
    private readonly batchSize: number = 50
  ) {}

  async process(): Promise<void> {
    const transactions = await this.transactionReader.readTransactions()

    const batches = this.chunkTransactionsIntoBatches(transactions)
    const categorizedBatches = await Promise.all(
      batches.map((batch) => this.transactionCategorizer.categorize(batch))
    )
    const categorizedTransactions = categorizedBatches.reduce(
      (allTransactions, batchTransactions) =>
        allTransactions.concat(batchTransactions),
      []
    )

    await this.transactionWriter.writeTransactions(categorizedTransactions)
  }

  private chunkTransactionsIntoBatches(
    transactions: BankTransaction[]
  ): BankTransaction[][] {
    return transactions.reduce(
      (batches: BankTransaction[][], transaction, index) => {
        const batchIndex = Math.floor(index / this.batchSize)
        if (!batches[batchIndex]) {
          batches[batchIndex] = []
        }
        batches[batchIndex].push(transaction)
        return batches
      },
      []
    )
  }
}
