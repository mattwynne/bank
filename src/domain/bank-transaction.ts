import { Category } from "./category"
import { Description } from "./description"
import { Amount } from "./amount"

export class BankTransaction {
  constructor(
    public readonly id: number,
    public readonly date: Date,
    public readonly description: Description,
    public readonly amount: Amount,
    public readonly category?: Category
  ) {}

  withCategory(category: Category): BankTransaction {
    return new BankTransaction(
      this.id,
      this.date,
      this.description,
      this.amount,
      category
    )
  }

  tokens(): string[] {
    return this.description.value
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (token) =>
          !/\d+/.test(token) && // Remove mostly numbers
          !token.includes("@") // Remove emails
      )
  }
}
