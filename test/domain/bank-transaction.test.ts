import { assertThat, is } from "hamjest"
import { BankTransaction } from "../../src/domain/bank-transaction"
import { Category } from "../../src/domain/category"
import { Description } from "../../src/domain/description"
import { Amount } from "../../src/domain/amount"

describe("BankTransaction", () => {
  describe("constructor", () => {
    it("should create transaction with all provided fields", () => {
      const date = new Date("2023-01-15")
      const transaction = new BankTransaction(
        date,
        new Description("Coffee Shop"),
        Amount.debit(5.5)
      )

      assertThat(transaction.date, is(date))
      assertThat(transaction.description.value, is("Coffee Shop"))
      assertThat(transaction.amount.value, is(-5.5))
      assertThat(transaction.category, is(undefined))
    })

    it("should create transaction with category", () => {
      const date = new Date("2023-01-15")
      const category = new Category("Food & Dining")
      const transaction = new BankTransaction(
        date,
        new Description("Coffee Shop"),
        Amount.debit(5.5),
        category
      )

      assertThat(transaction.category, is(category))
    })
  })

  describe("withCategory", () => {
    it("should return new transaction with category attached", () => {
      const originalTransaction = new BankTransaction(
        new Date("2023-01-15"),
        new Description("Coffee Shop"),
        Amount.debit(5.5)
      )
      const category = new Category("Food & Dining")

      const categorizedTransaction = originalTransaction.withCategory(category)

      assertThat(categorizedTransaction.date, is(originalTransaction.date))
      assertThat(
        categorizedTransaction.description,
        is(originalTransaction.description)
      )
      assertThat(categorizedTransaction.amount, is(originalTransaction.amount))
      assertThat(categorizedTransaction.category, is(category))
    })

    it("should not modify original transaction", () => {
      const originalTransaction = new BankTransaction(
        new Date("2023-01-15"),
        new Description("Coffee Shop"),
        Amount.debit(5.5)
      )
      const category = new Category("Food & Dining")

      originalTransaction.withCategory(category)

      assertThat(originalTransaction.category, is(undefined))
    })
  })
})
