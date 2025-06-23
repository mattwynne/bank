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

    it("should categorize all transactions in batch", async () => {
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
      assertThat(receivedTransactions[0].description.value, is("Coffee Shop"))
      assertThat(receivedTransactions[1].description.value, is("Grocery Store"))
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

    it("should process transactions in batches of specified size", async () => {
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
        new BankTransaction(
          3,
          new Date("2023-01-03"),
          new Description("Gas Station"),
          Amount.debit(30.0)
        ),
        new BankTransaction(
          4,
          new Date("2023-01-04"),
          new Description("Restaurant"),
          Amount.debit(25.0)
        ),
        new BankTransaction(
          5,
          new Date("2023-01-05"),
          new Description("Pharmacy"),
          Amount.debit(15.0)
        ),
      ]

      mockReader.readTransactions = async () => transactions

      const categorizerCalls: BankTransaction[][] = []
      mockCategorizer.categorize = async (
        transactionBatch: BankTransaction[]
      ) => {
        categorizerCalls.push(transactionBatch)
        return transactionBatch.map((transaction) =>
          transaction.withCategory(new Category("Test Category"))
        )
      }

      const processorWithBatchSize = new Processor(
        mockReader,
        mockCategorizer,
        mockWriter,
        2
      )

      await processorWithBatchSize.process()

      // Should have made 3 calls: [2, 2, 1] transactions
      assertThat(categorizerCalls, hasSize(3))
      assertThat(categorizerCalls[0], hasSize(2))
      assertThat(categorizerCalls[1], hasSize(2))
      assertThat(categorizerCalls[2], hasSize(1))

      // Verify the transactions are batched correctly by description
      assertThat(categorizerCalls[0][0].description.value, is("Coffee Shop"))
      assertThat(categorizerCalls[0][1].description.value, is("Grocery Store"))
      assertThat(categorizerCalls[1][0].description.value, is("Gas Station"))
      assertThat(categorizerCalls[1][1].description.value, is("Restaurant"))
      assertThat(categorizerCalls[2][0].description.value, is("Pharmacy"))
    })
  })
})
