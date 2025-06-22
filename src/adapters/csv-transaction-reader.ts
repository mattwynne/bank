import { TransactionReader } from "../ports/transaction-reader"
import { BankTransaction } from "../domain/bank-transaction"
import * as fs from "fs"
import csv from "csv-parser"

export class CsvTransactionReader implements TransactionReader {
  constructor(private readonly filePath: string) {}

  async readTransactions(): Promise<BankTransaction[]> {
    return new Promise((resolve, reject) => {
      const transactions: BankTransaction[] = []

      // Check if file exists first
      if (!fs.existsSync(this.filePath)) {
        reject(
          new Error(`Failed to read CSV file: File not found: ${this.filePath}`)
        )
        return
      }

      const stream = fs.createReadStream(this.filePath).pipe(
        csv({
          headers: false,
        })
      )

      stream.on("data", (row: any) => {
        try {
          const transaction = this.parseTransactionRow(row)
          if (transaction) {
            transactions.push(transaction)
          }
        } catch (error) {
          // Skip malformed rows but continue processing
          console.warn(
            `Warning: Skipping malformed row: ${JSON.stringify(row)}`
          )
        }
      })

      stream.on("end", () => {
        resolve(transactions)
      })

      stream.on("error", (error: any) => {
        reject(new Error(`Failed to read CSV file: ${error.message}`))
      })
    })
  }

  private parseTransactionRow(row: any): BankTransaction | null {
    // CIBC CSV format: Date,Description,Debit Amount,Credit Amount
    const dateString = row["0"]?.trim()
    const description = row["1"]?.trim()
    const debitAmount = row["2"]?.trim()
    const creditAmount = row["3"]?.trim()

    // Skip empty rows
    if (!dateString || !description) {
      return null
    }

    // Parse date
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`)
    }

    // Calculate amount (debits are negative, credits are positive)
    let amount = 0
    if (debitAmount && debitAmount !== "") {
      amount = -parseFloat(debitAmount)
    } else if (creditAmount && creditAmount !== "") {
      amount = parseFloat(creditAmount)
    }

    if (isNaN(amount)) {
      throw new Error(
        `Invalid amount: debit='${debitAmount}', credit='${creditAmount}'`
      )
    }

    return new BankTransaction(date, description, amount)
  }
}
