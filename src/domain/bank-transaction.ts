import { Category } from "./category"
import { Description } from "./description"

export class BankTransaction {
  constructor(
    public readonly date: Date,
    public readonly description: Description,
    public readonly amount: number,
    public readonly category?: Category
  ) {}

  withCategory(category: Category): BankTransaction {
    return new BankTransaction(
      this.date,
      this.description,
      this.amount,
      category
    )
  }
}
