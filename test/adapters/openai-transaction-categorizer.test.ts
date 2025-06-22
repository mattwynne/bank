import { assertThat, is, hasSize } from "hamjest"
import { OpenAiTransactionCategorizer } from "../../src/adapters/openai-transaction-categorizer"
import { BankTransaction } from "../../src/domain/bank-transaction"
import { Category } from "../../src/domain/category"
import { Description } from "../../src/domain/description"
import { Amount } from "../../src/domain/amount"

describe("OpenAiTransactionCategorizer", () => {
  let mockOpenAiClient: any
  let categorizer: OpenAiTransactionCategorizer

  beforeEach(() => {
    mockOpenAiClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify([
                    { category: "Food & Dining" },
                    { category: "Groceries" },
                  ]),
                },
              },
            ],
          }),
        },
      },
    }

    categorizer = new OpenAiTransactionCategorizer(mockOpenAiClient)
  })

  describe("categorize", () => {
    it("should categorize transactions using OpenAI", async () => {
      const transactions = [
        new BankTransaction(
          new Date("2023-01-01"),
          new Description("STARBUCKS COFFEE"),
          Amount.debit(4.5)
        ),
        new BankTransaction(
          new Date("2023-01-02"),
          new Description("WHOLE FOODS MARKET"),
          Amount.debit(67.23)
        ),
      ]

      const result = await categorizer.categorize(transactions)

      assertThat(result, hasSize(2))
      assertThat(result[0].category?.name, is("Food & Dining"))
      assertThat(result[1].category?.name, is("Groceries"))
    })

    it("should send properly formatted prompt to OpenAI", async () => {
      const transactions = [
        new BankTransaction(
          new Date("2023-01-01"),
          new Description("STARBUCKS COFFEE"),
          Amount.debit(4.5)
        ),
      ]

      let capturedPrompt = ""
      mockOpenAiClient.chat.completions.create = async (request: any) => {
        capturedPrompt = request.messages[1].content
        return {
          choices: [
            {
              message: {
                content: JSON.stringify([{ category: "Food & Dining" }]),
              },
            },
          ],
        }
      }

      await categorizer.categorize(transactions)

      assertThat(capturedPrompt.includes("STARBUCKS COFFEE"), is(true))
      assertThat(capturedPrompt.includes("-$4.50"), is(true))
      assertThat(capturedPrompt.includes("2023-01-01"), is(true))
    })

    it("should use system prompt for categorization rules", async () => {
      const transactions = [
        new BankTransaction(
          new Date("2023-01-01"),
          new Description("STARBUCKS COFFEE"),
          Amount.debit(4.5)
        ),
      ]

      let capturedMessages: any[] = []
      mockOpenAiClient.chat.completions.create = async (request: any) => {
        capturedMessages = request.messages
        return {
          choices: [
            {
              message: {
                content: JSON.stringify([{ category: "Food & Dining" }]),
              },
            },
          ],
        }
      }

      await categorizer.categorize(transactions)

      assertThat(capturedMessages, hasSize(2))
      assertThat(capturedMessages[0].role, is("system"))
      assertThat(capturedMessages[1].role, is("user"))
      assertThat(capturedMessages[0].content.includes("categorize"), is(true))
    })

    it("should preserve original transaction data", async () => {
      const originalTransaction = new BankTransaction(
        new Date("2023-01-01"),
        new Description("STARBUCKS COFFEE"),
        Amount.debit(4.5)
      )

      const result = await categorizer.categorize([originalTransaction])

      assertThat(result[0].description.value, is("STARBUCKS COFFEE"))
      assertThat(result[0].amount.value, is(-4.5))
      assertThat(result[0].date, is(originalTransaction.date))
    })

    it("should handle multiple transactions in batch", async () => {
      const transactions = [
        new BankTransaction(
          new Date("2023-01-01"),
          new Description("STARBUCKS"),
          Amount.debit(4.5)
        ),
        new BankTransaction(
          new Date("2023-01-02"),
          new Description("SHELL GAS"),
          Amount.debit(35.0)
        ),
        new BankTransaction(
          new Date("2023-01-03"),
          new Description("GROCERY STORE"),
          Amount.debit(67.23)
        ),
      ]

      mockOpenAiClient.chat.completions.create = async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify([
                { category: "Food & Dining" },
                { category: "Transportation" },
                { category: "Groceries" },
              ]),
            },
          },
        ],
      })

      const result = await categorizer.categorize(transactions)

      assertThat(result, hasSize(3))
      assertThat(result[0].category?.name, is("Food & Dining"))
      assertThat(result[1].category?.name, is("Transportation"))
      assertThat(result[2].category?.name, is("Groceries"))
    })
  })
})
