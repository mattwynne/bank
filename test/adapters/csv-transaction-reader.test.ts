import { assertThat, is, hasSize } from "hamjest"
import { CsvTransactionReader } from "../../src/adapters/csv-transaction-reader"
import { BankTransaction } from "../../src/domain/bank-transaction"
import * as fs from "fs"
import * as path from "path"

describe("CsvTransactionReader", () => {
  const testFixturesDir = path.join(__dirname, "../fixtures")
  const testCsvPath = path.join(testFixturesDir, "test-transactions.csv")

  let reader: CsvTransactionReader

  beforeEach(() => {
    // Ensure fixtures directory exists
    if (!fs.existsSync(testFixturesDir)) {
      fs.mkdirSync(testFixturesDir, { recursive: true })
    }

    reader = new CsvTransactionReader(testCsvPath)
  })

  afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath)
    }
  })

  describe("readTransactions", () => {
    it("should read transactions from CSV file with CIBC format", async () => {
      const csvContent = [
        "2023-01-15,Internet Banking E-TRANSFER 105503693902 John Doe,100.00,",
        "2023-01-14,Point of Sale - Interac RETAIL PURCHASE 516419480876 COFFEE SHOP,5.50,",
        "2023-01-13,Electronic Funds Transfer PAY SALARY-123 Company Name,,2500.00",
        "2023-01-12,CHEQUE 001 82657362,250.00,",
      ].join("\n")

      fs.writeFileSync(testCsvPath, csvContent)

      const transactions = await reader.readTransactions()

      assertThat(transactions, hasSize(4))

      // Test debit transaction (E-TRANSFER)
      assertThat(transactions[0].date, is(new Date("2023-01-15")))
      assertThat(
        transactions[0].description.value,
        is("Internet Banking E-TRANSFER 105503693902 John Doe")
      )
      assertThat(transactions[0].amount.value, is(-100.0))

      // Test debit transaction (Point of Sale)
      assertThat(transactions[1].date, is(new Date("2023-01-14")))
      assertThat(
        transactions[1].description.value,
        is("Point of Sale - Interac RETAIL PURCHASE 516419480876 COFFEE SHOP")
      )
      assertThat(transactions[1].amount.value, is(-5.5))

      // Test credit transaction (Salary)
      assertThat(transactions[2].date, is(new Date("2023-01-13")))
      assertThat(
        transactions[2].description.value,
        is("Electronic Funds Transfer PAY SALARY-123 Company Name")
      )
      assertThat(transactions[2].amount.value, is(2500.0))

      // Test debit transaction (Cheque)
      assertThat(transactions[3].date, is(new Date("2023-01-12")))
      assertThat(transactions[3].description.value, is("CHEQUE 001 82657362"))
      assertThat(transactions[3].amount.value, is(-250.0))
    })

    it("should handle transactions with commas in descriptions", async () => {
      const csvContent = [
        '2023-01-15,"Restaurant, Cafe & Bar",25.50,',
        '2023-01-14,"Smith, Jones & Associates",150.00,',
      ].join("\n")

      fs.writeFileSync(testCsvPath, csvContent)

      const transactions = await reader.readTransactions()

      assertThat(transactions, hasSize(2))
      assertThat(
        transactions[0].description.value,
        is("Restaurant, Cafe & Bar")
      )
      assertThat(
        transactions[1].description.value,
        is("Smith, Jones & Associates")
      )
    })

    it("should handle empty file", async () => {
      fs.writeFileSync(testCsvPath, "")

      const transactions = await reader.readTransactions()

      assertThat(transactions, hasSize(0))
    })

    it("should handle file with only whitespace", async () => {
      fs.writeFileSync(testCsvPath, "   \n  \n   ")

      const transactions = await reader.readTransactions()

      assertThat(transactions, hasSize(0))
    })

    it("should parse different date formats correctly", async () => {
      const csvContent = [
        "2023-01-01,New Year Transaction,10.00,",
        "2023-12-31,Year End Transaction,20.00,",
      ].join("\n")

      fs.writeFileSync(testCsvPath, csvContent)

      const transactions = await reader.readTransactions()

      assertThat(transactions, hasSize(2))
      assertThat(transactions[0].date, is(new Date("2023-01-01")))
      assertThat(transactions[1].date, is(new Date("2023-12-31")))
    })

    it("should handle mixed debit and credit transactions", async () => {
      const csvContent = [
        "2023-01-15,Grocery Store,45.00,", // Debit
        "2023-01-14,Salary Deposit,,2500.00", // Credit
        "2023-01-13,Gas Station,35.00,", // Debit
        "2023-01-12,Refund,,25.50", // Credit
      ].join("\n")

      fs.writeFileSync(testCsvPath, csvContent)

      const transactions = await reader.readTransactions()

      assertThat(transactions, hasSize(4))
      assertThat(transactions[0].amount.value, is(-45.0)) // Debit (negative)
      assertThat(transactions[1].amount.value, is(2500.0)) // Credit (positive)
      assertThat(transactions[2].amount.value, is(-35.0)) // Debit (negative)
      assertThat(transactions[3].amount.value, is(25.5)) // Credit (positive)
    })

    it("should throw error for non-existent file", async () => {
      const nonExistentReader = new CsvTransactionReader(
        "/path/that/does/not/exist.csv"
      )

      let errorThrown = false
      try {
        await nonExistentReader.readTransactions()
      } catch (error) {
        errorThrown = true
        assertThat(error instanceof Error, is(true))
        assertThat(
          (error as Error).message.includes("Failed to read CSV file"),
          is(true)
        )
      }

      assertThat(errorThrown, is(true))
    })
  })
})
