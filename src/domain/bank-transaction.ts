import { Category } from "./category"

export class BankTransaction {
  constructor(
    public readonly date: Date,
    public readonly description: string,
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
