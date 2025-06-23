import { BankTransaction } from "../domain/bank-transaction"

export interface TransactionCategorizer {
  categorizeByTokens(tokens: string[]): Promise<string>
}
