import { assertThat, is } from "hamjest"
import { CsvTransactionWriter } from "../../src/adapters/csv-transaction-writer"
import { BankTransaction } from "../../src/domain/bank-transaction"
import { Category } from "../../src/domain/category"
import { Description } from "../../src/domain/description"
import { Amount } from "../../src/domain/amount"
import * as fs from "fs"
import * as path from "path"

describe("CsvTransactionWriter", () => {
  const testOutputPath = path.join(__dirname, "test-output.csv")

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath)
    }
  })

  describe("writeTransactions", () => {
    it("should write empty transactions to CSV file", async () => {
      const writer = new CsvTransactionWriter(testOutputPath)

      await writer.writeTransactions([])

      assertThat(fs.existsSync(testOutputPath), is(true))
      const content = fs.readFileSync(testOutputPath, "utf8")
      assertThat(
        content.trim(),
        is("Date,Description,Debit Amount,Credit Amount,Category")
      )
    })

    it("should write single debit transaction to CSV file", async () => {
      const writer = new CsvTransactionWriter(testOutputPath)
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("STARBUCKS COFFEE"),
        Amount.debit(4.5),
        new Category("Food & Dining")
      )

      await writer.writeTransactions([transaction])

      assertThat(fs.existsSync(testOutputPath), is(true))
      const content = fs.readFileSync(testOutputPath, "utf8")
      const lines = content.trim().split("\n")
      assertThat(
        lines[0],
        is("Date,Description,Debit Amount,Credit Amount,Category")
      )
      assertThat(
        lines[1],
        is("2023-01-15,STARBUCKS COFFEE,4.50,,Food & Dining")
      )
    })

    it("should write single credit transaction to CSV file", async () => {
      const writer = new CsvTransactionWriter(testOutputPath)
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-16"),
        new Description("SALARY DEPOSIT"),
        Amount.credit(2500.0),
        new Category("Income")
      )

      await writer.writeTransactions([transaction])

      assertThat(fs.existsSync(testOutputPath), is(true))
      const content = fs.readFileSync(testOutputPath, "utf8")
      const lines = content.trim().split("\n")
      assertThat(
        lines[0],
        is("Date,Description,Debit Amount,Credit Amount,Category")
      )
      assertThat(lines[1], is("2023-01-16,SALARY DEPOSIT,,2500.00,Income"))
    })

    it("should write multiple transactions with mixed debits and credits", async () => {
      const writer = new CsvTransactionWriter(testOutputPath)
      const transactions = [
        new BankTransaction(
          1,
          new Date("2023-01-15"),
          new Description("STARBUCKS COFFEE"),
          Amount.debit(4.5),
          new Category("Food & Dining")
        ),
        new BankTransaction(
          2,
          new Date("2023-01-16"),
          new Description("SALARY DEPOSIT"),
          Amount.credit(2500.0),
          new Category("Income")
        ),
        new BankTransaction(
          3,
          new Date("2023-01-17"),
          new Description("GROCERY STORE"),
          Amount.debit(67.23),
          new Category("Groceries")
        ),
      ]

      await writer.writeTransactions(transactions)

      assertThat(fs.existsSync(testOutputPath), is(true))
      const content = fs.readFileSync(testOutputPath, "utf8")
      const lines = content.trim().split("\n")
      assertThat(
        lines[0],
        is("Date,Description,Debit Amount,Credit Amount,Category")
      )
      assertThat(
        lines[1],
        is("2023-01-15,STARBUCKS COFFEE,4.50,,Food & Dining")
      )
      assertThat(lines[2], is("2023-01-16,SALARY DEPOSIT,,2500.00,Income"))
      assertThat(lines[3], is("2023-01-17,GROCERY STORE,67.23,,Groceries"))
    })

    it("should handle transactions without categories", async () => {
      const writer = new CsvTransactionWriter(testOutputPath)
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("UNKNOWN MERCHANT"),
        Amount.debit(25.0)
      )

      await writer.writeTransactions([transaction])

      assertThat(fs.existsSync(testOutputPath), is(true))
      const content = fs.readFileSync(testOutputPath, "utf8")
      const lines = content.trim().split("\n")
      assertThat(
        lines[0],
        is("Date,Description,Debit Amount,Credit Amount,Category")
      )
      assertThat(lines[1], is("2023-01-15,UNKNOWN MERCHANT,25.00,,"))
    })

    it("should handle descriptions with commas", async () => {
      const writer = new CsvTransactionWriter(testOutputPath)
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-15"),
        new Description("Restaurant, Cafe & Bar"),
        Amount.debit(35.75),
        new Category("Food & Dining")
      )

      await writer.writeTransactions([transaction])

      assertThat(fs.existsSync(testOutputPath), is(true))
      const content = fs.readFileSync(testOutputPath, "utf8")
      const lines = content.trim().split("\n")
      assertThat(
        lines[0],
        is("Date,Description,Debit Amount,Credit Amount,Category")
      )
      assertThat(
        lines[1],
        is('2023-01-15,"Restaurant, Cafe & Bar",35.75,,Food & Dining')
      )
    })
  })
})
