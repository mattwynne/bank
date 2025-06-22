import { BankTransaction } from "../domain/bank-transaction"

export interface TransactionCategorizer {
  categorize(transactions: BankTransaction[]): Promise<BankTransaction[]>
}
