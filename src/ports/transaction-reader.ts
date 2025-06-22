import { BankTransaction } from "../domain/bank-transaction"

export interface TransactionReader {
  readTransactions(): Promise<BankTransaction[]>
}
