import { assertThat, is } from "hamjest"
import { OpenAiTransactionCategorizer } from "../../src/adapters/openai-transaction-categorizer"

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
                  content: "Food & Dining",
                },
              },
            ],
          }),
        },
      },
    }

    categorizer = new OpenAiTransactionCategorizer(mockOpenAiClient)
  })

  describe("categorizeByTokens", () => {
    it("should categorize transactions by tokens using OpenAI", async () => {
      const tokens = ["starbucks", "coffee"]

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Food & Dining"))
    })

    it("should send properly formatted prompt to OpenAI", async () => {
      const tokens = ["starbucks", "coffee", "shop"]

      let capturedPrompt = ""
      mockOpenAiClient.chat.completions.create = async (request: any) => {
        capturedPrompt = request.messages[1].content
        return {
          choices: [
            {
              message: {
                content: "Food & Dining",
              },
            },
          ],
        }
      }

      await categorizer.categorizeByTokens(tokens)

      assertThat(capturedPrompt.includes("starbucks, coffee, shop"), is(true))
      assertThat(
        capturedPrompt.includes(
          "Categorize transactions with these description tokens"
        ),
        is(true)
      )
    })

    it("should use system prompt for categorization rules", async () => {
      const tokens = ["starbucks", "coffee"]

      let capturedMessages: any[] = []
      mockOpenAiClient.chat.completions.create = async (request: any) => {
        capturedMessages = request.messages
        return {
          choices: [
            {
              message: {
                content: "Food & Dining",
              },
            },
          ],
        }
      }

      await categorizer.categorizeByTokens(tokens)

      assertThat(capturedMessages.length, is(2))
      assertThat(capturedMessages[0].role, is("system"))
      assertThat(capturedMessages[1].role, is("user"))
      assertThat(capturedMessages[0].content.includes("categorize"), is(true))
      assertThat(capturedMessages[0].content.includes("tokens"), is(true))
    })

    it("should return trimmed category response", async () => {
      const tokens = ["grocery", "store"]

      mockOpenAiClient.chat.completions.create = async () => ({
        choices: [
          {
            message: {
              content: "  Groceries  ",
            },
          },
        ],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Groceries"))
    })

    it("should handle different token combinations", async () => {
      const tokens = ["shell", "gas", "station"]

      mockOpenAiClient.chat.completions.create = async () => ({
        choices: [
          {
            message: {
              content: "Transportation",
            },
          },
        ],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Transportation"))
    })

    it("should handle single token", async () => {
      const tokens = ["salary"]

      mockOpenAiClient.chat.completions.create = async () => ({
        choices: [
          {
            message: {
              content: "Salary",
            },
          },
        ],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Salary"))
    })

    it("should handle empty tokens array", async () => {
      const tokens: string[] = []

      mockOpenAiClient.chat.completions.create = async () => ({
        choices: [
          {
            message: {
              content: "Unknown",
            },
          },
        ],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Unknown"))
    })
  })
})
