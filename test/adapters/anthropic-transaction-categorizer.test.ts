import { assertThat, is } from "hamjest"
import { AnthropicTransactionCategorizer } from "../../src/adapters/anthropic-transaction-categorizer"

describe("AnthropicTransactionCategorizer", () => {
  let mockAnthropicClient: any
  let categorizer: AnthropicTransactionCategorizer

  beforeEach(() => {
    mockAnthropicClient = {
      messages: {
        create: async () => ({
          content: [{ type: "text", text: "Food & Dining" }],
        }),
      },
    }

    categorizer = new AnthropicTransactionCategorizer(mockAnthropicClient)
  })

  describe("categorizeByTokens", () => {
    it("should categorize transactions by tokens using Anthropic", async () => {
      const tokens = ["starbucks", "coffee"]

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Food & Dining"))
    })

    it("should send properly formatted prompt to Anthropic", async () => {
      const tokens = ["starbucks", "coffee", "shop"]

      let capturedUserMessage = ""
      mockAnthropicClient.messages.create = async (request: any) => {
        capturedUserMessage = request.messages[0].content
        return {
          content: [{ type: "text", text: "Food & Dining" }],
        }
      }

      await categorizer.categorizeByTokens(tokens)

      assertThat(capturedUserMessage, is("starbucks, coffee, shop"))
    })

    it("should use system prompt for categorization rules", async () => {
      const tokens = ["starbucks", "coffee"]

      let capturedRequest: any
      mockAnthropicClient.messages.create = async (request: any) => {
        capturedRequest = request
        return {
          content: [{ type: "text", text: "Food & Dining" }],
        }
      }

      await categorizer.categorizeByTokens(tokens)

      assertThat(capturedRequest.system.includes("categorize"), is(true))
      assertThat(capturedRequest.system.includes("tokens"), is(true))
      assertThat(capturedRequest.messages[0].role, is("user"))
    })

    it("should return trimmed category response", async () => {
      const tokens = ["grocery", "store"]

      mockAnthropicClient.messages.create = async () => ({
        content: [{ type: "text", text: "  Groceries  " }],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Groceries"))
    })

    it("should handle different token combinations", async () => {
      const tokens = ["shell", "gas", "station"]

      mockAnthropicClient.messages.create = async () => ({
        content: [{ type: "text", text: "Transportation" }],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Transportation"))
    })

    it("should handle single token", async () => {
      const tokens = ["salary"]

      mockAnthropicClient.messages.create = async () => ({
        content: [{ type: "text", text: "Salary" }],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Salary"))
    })

    it("should handle empty tokens array", async () => {
      const tokens: string[] = []

      mockAnthropicClient.messages.create = async () => ({
        content: [{ type: "text", text: "Unknown" }],
      })

      const result = await categorizer.categorizeByTokens(tokens)

      assertThat(result, is("Unknown"))
    })
  })
})
