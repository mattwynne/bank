import { BankTransaction } from "../domain/bank-transaction"

export interface TransactionWriter {
  writeTransactions(transactions: BankTransaction[]): Promise<void>
}
