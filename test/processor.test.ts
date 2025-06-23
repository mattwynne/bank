import { assertThat, is, hasSize } from "hamjest"
import { Processor } from "../src/processor"
import { TransactionReader } from "../src/ports/transaction-reader"
import { TransactionCategorizer } from "../src/ports/transaction-categorizer"
import { TransactionWriter } from "../src/ports/transaction-writer"
import { BankTransaction } from "../src/domain/bank-transaction"
import { Category } from "../src/domain/category"
import { Description } from "../src/domain/description"
import { Amount } from "../src/domain/amount"

describe("Processor", () => {
  let mockReader: TransactionReader
  let mockCategorizer: TransactionCategorizer
  let mockWriter: TransactionWriter
  let processor: Processor

  beforeEach(() => {
    mockReader = {
      readTransactions: async () => [],
    }

    mockCategorizer = {
      categorize: async (transactions: BankTransaction[]) =>
        transactions.map((transaction) =>
          transaction.withCategory(new Category("test-category"))
        ),
    }

    mockWriter = {
      writeTransactions: async (transactions: BankTransaction[]) => {},
    }

    processor = new Processor(mockReader, mockCategorizer, mockWriter, 10)
  })

  describe("process", () => {
    it("should process an empty list of transactions", async () => {
      await processor.process()
      // This test just ensures the basic flow works with empty data
    })

    it("should read transactions from the reader", async () => {
      let readCalled = false
      mockReader.readTransactions = async () => {
        readCalled = true
        return []
      }

      await processor.process()

      assertThat(readCalled, is(true))
    })

    it("should categorize all transactions in groups by similarity", async () => {
      const transactions = [
        new BankTransaction(
          1,
          new Date("2023-01-01"),
          new Description("Coffee Shop"),
          Amount.debit(5.5)
        ),
        new BankTransaction(
          2,
          new Date("2023-01-02"),
          new Description("Grocery Store"),
          Amount.debit(45.0)
        ),
      ]

      mockReader.readTransactions = async () => transactions

      let allReceivedTransactions: BankTransaction[] = []
      mockCategorizer.categorize = async (transactions: BankTransaction[]) => {
        allReceivedTransactions.push(...transactions)
        return transactions.map((transaction) =>
          transaction.withCategory(new Category("Food"))
        )
      }

      await processor.process()

      assertThat(allReceivedTransactions, hasSize(2))
      const descriptions = allReceivedTransactions.map(
        (t) => t.description.value
      )
      assertThat(descriptions.includes("Coffee Shop"), is(true))
      assertThat(descriptions.includes("Grocery Store"), is(true))
    })

    it("should write categorized transactions", async () => {
      const transaction = new BankTransaction(
        1,
        new Date("2023-01-01"),
        new Description("Coffee Shop"),
        Amount.debit(5.5)
      )
      mockReader.readTransactions = async () => [transaction]
      mockCategorizer.categorize = async (transactions: BankTransaction[]) => [
        transactions[0].withCategory(new Category("Food")),
      ]

      let writtenTransactions: BankTransaction[] = []
      mockWriter.writeTransactions = async (
        transactions: BankTransaction[]
      ) => {
        writtenTransactions = transactions
      }

      await processor.process()

      assertThat(writtenTransactions, hasSize(1))
      assertThat(writtenTransactions[0].category?.name, is("Food"))
    })

    it("should group transactions with similar descriptions together", async () => {
      const transactions = [
        new BankTransaction(
          1,
          new Date("2023-01-01"),
          new Description(
            "Internet Banking E-TRANSFER 105483383773 Amy Farrish"
          ),
          Amount.debit(277.5)
        ),
        new BankTransaction(
          2,
          new Date("2023-01-02"),
          new Description(
            "Internet Banking E-TRANSFER 105440322530 Amy Farrish"
          ),
          Amount.debit(240.0)
        ),
        new BankTransaction(
          3,
          new Date("2023-01-03"),
          new Description(
            "Point of Sale - Interac RETAIL PURCHASE 516419480876 COFFEE SHOP"
          ),
          Amount.debit(5.5)
        ),
        new BankTransaction(
          4,
          new Date("2023-01-04"),
          new Description(
            "Point of Sale - Interac RETAIL PURCHASE 516419480999 COFFEE SHOP"
          ),
          Amount.debit(4.25)
        ),
        new BankTransaction(
          5,
          new Date("2023-01-05"),
          new Description("CHEQUE 001 82657362"),
          Amount.debit(100.0)
        ),
      ]

      mockReader.readTransactions = async () => transactions

      const categorizerCalls: BankTransaction[][] = []
      mockCategorizer.categorize = async (
        transactionGroup: BankTransaction[]
      ) => {
        categorizerCalls.push(transactionGroup)
        return transactionGroup.map((transaction) =>
          transaction.withCategory(new Category("Test Category"))
        )
      }

      await processor.process()

      // Should group similar e-transfers together and similar coffee shop purchases together
      // Plus the cheque should be in its own group
      // So we expect fewer groups than individual transactions
      assertThat(categorizerCalls.length, is(3)) // 3 distinct groups

      // Find the e-transfer group (should have 2 transactions)
      const eTransferGroup = categorizerCalls.find((group) =>
        group.some((t) => t.description.value.includes("Amy Farrish"))
      )
      assertThat(eTransferGroup, is(hasSize(2)))

      // Find the coffee shop group (should have 2 transactions)
      const coffeeGroup = categorizerCalls.find((group) =>
        group.some((t) => t.description.value.includes("COFFEE SHOP"))
      )
      assertThat(coffeeGroup, is(hasSize(2)))

      // Find the cheque group (should have 1 transaction)
      const chequeGroup = categorizerCalls.find((group) =>
        group.some((t) => t.description.value.includes("CHEQUE"))
      )
      assertThat(chequeGroup, is(hasSize(1)))
    })
  })
})
