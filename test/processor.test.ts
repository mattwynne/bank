import { assertThat, is, hasSize } from "hamjest"
import { Processor } from "../src/processor"
import { TransactionReader } from "../src/ports/transaction-reader"
import { TransactionCategorizer } from "../src/ports/transaction-categorizer"
import { TransactionWriter } from "../src/ports/transaction-writer"
import { BankTransaction } from "../src/domain/bank-transaction"
import { Category } from "../src/domain/category"

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

    processor = new Processor(mockReader, mockCategorizer, mockWriter)
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

    it("should categorize all transactions in batch", async () => {
      const transactions = [
        new BankTransaction("123", new Date("2023-01-01"), "Coffee Shop", -5.5),
        new BankTransaction(
          "124",
          new Date("2023-01-02"),
          "Grocery Store",
          -45.0
        ),
      ]

      mockReader.readTransactions = async () => transactions

      let receivedTransactions: BankTransaction[] = []
      mockCategorizer.categorize = async (transactions: BankTransaction[]) => {
        receivedTransactions = transactions
        return [
          transactions[0].withCategory(new Category("Food")),
          transactions[1].withCategory(new Category("Groceries")),
        ]
      }

      await processor.process()

      assertThat(receivedTransactions, hasSize(2))
      assertThat(receivedTransactions[0].description, is("Coffee Shop"))
      assertThat(receivedTransactions[1].description, is("Grocery Store"))
    })

    it("should write categorized transactions", async () => {
      const transaction = new BankTransaction(
        "123",
        new Date("2023-01-01"),
        "Coffee Shop",
        -5.5
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
  })
})
