import { TransactionWriter } from "../ports/transaction-writer"
import { BankTransaction } from "../domain/bank-transaction"
import * as createCsvWriter from "csv-writer"

export class CsvTransactionWriter implements TransactionWriter {
  constructor(private readonly filePath: string) {}

  async writeTransactions(transactions: BankTransaction[]): Promise<void> {
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: this.filePath,
      header: [
        { id: "date", title: "Date" },
        { id: "description", title: "Description" },
        { id: "debitAmount", title: "Debit Amount" },
        { id: "creditAmount", title: "Credit Amount" },
        { id: "category", title: "Category" },
      ],
    })

    const records = transactions.map((transaction) => {
      const isDebit = transaction.amount.value < 0
      return {
        date: transaction.date.toISOString().split("T")[0], // YYYY-MM-DD format
        description: transaction.description.toString(),
        debitAmount: isDebit
          ? Math.abs(transaction.amount.value).toFixed(2)
          : "",
        creditAmount: isDebit ? "" : transaction.amount.value.toFixed(2),
        category: transaction.category?.name || "",
      }
    })

    await csvWriter.writeRecords(records)
  }
}
