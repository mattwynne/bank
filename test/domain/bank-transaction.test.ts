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
        1,
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
        1,
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
        1,
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
        1,
        new Date("2023-01-15"),
        new Description("Coffee Shop"),
        Amount.debit(5.5)
      )
      const category = new Category("Food & Dining")

      originalTransaction.withCategory(category)

      assertThat(originalTransaction.category, is(undefined))
    })
  })

  describe("tokens", () => {
    it("should extract basic meaningful tokens", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("Coffee Shop Downtown"),
        Amount.debit(5.5)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "coffee", "shop", "downtown"]))
    })

    it("should remove pure numbers", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("Internet Banking E-TRANSFER 105483383773 Amy Farrish"),
        Amount.debit(277.5)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "e-transfer", "amy", "farrish"]))
    })

    it("should NOT remove common noise words", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description(
          "Internet Banking Electronic Funds Transfer PAY John Doe"
        ),
        Amount.debit(100.0)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "pay", "john", "doe"]))
    })

    it("should remove tokens with email addresses", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("Payment to john.doe@example.com for services"),
        Amount.debit(150.0)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "payment", "to", "for", "services"]))
    })

    it("should NOT remove tokens shorter than 3 characters", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("Buy at a B shop XY"),
        Amount.debit(25.0)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "buy", "at", "a", "b", "shop", "xy"]))
    })

    it("should handle point of sale transactions", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description(
          "Point of Sale - Interac RETAIL PURCHASE 516419480876 COFFEE SHOP"
        ),
        Amount.debit(5.5)
      )

      const tokens = transaction.tokens()

      assertThat(
        tokens,
        is([
          "debit",
          "point",
          "of",
          "sale",
          "-",
          "interac",
          "retail",
          "purchase",
          "coffee",
          "shop",
        ])
      )
    })

    it("should handle cheque transactions", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("CHEQUE 001 82657362"),
        Amount.debit(250.0)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "cheque"]))
    })

    it("should handle empty meaningful tokens", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("123 456 78 90"),
        Amount.debit(10.0)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit"]))
    })

    it("should handle transactions with mixed case and whitespace", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("  Coffee   Shop    DOWNTOWN   "),
        Amount.debit(5.5)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "coffee", "shop", "downtown"]))
    })

    it("should group similar e-transfer transactions", () => {
      const transaction1 = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("Internet Banking E-TRANSFER 105483383773 Amy Farrish"),
        Amount.debit(277.5)
      )

      const transaction2 = new BankTransaction(
        2,
        new Date("2023-01-16"),
        new Description("Internet Banking E-TRANSFER 105440322530 Amy Farrish"),
        Amount.debit(240.0)
      )

      const tokens1 = transaction1.tokens()
      const tokens2 = transaction2.tokens()

      assertThat(tokens1, is(tokens2))
      assertThat(tokens1, is(["debit", "e-transfer", "amy", "farrish"]))
    })

    it("should convert to lowercase", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("STARBUCKS COFFEE SHOP"),
        Amount.debit(4.5)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["debit", "starbucks", "coffee", "shop"]))
    })

    it("should include credit as first token for credit transactions", () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("SALARY DEPOSIT"),
        Amount.credit(2500.0)
      )

      const tokens = transaction.tokens()

      assertThat(tokens, is(["credit", "salary", "deposit"]))
    })
  })
})
