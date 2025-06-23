import { assertThat, is, containsString } from "hamjest"
import { loadSystemPrompt } from "../../src/utils/prompt-loader"

describe("PromptLoader", () => {
  describe("loadSystemPrompt", () => {
    it("should load the system prompt from file", () => {
      const prompt = loadSystemPrompt()

      assertThat(prompt, containsString("financial transaction categorizer"))
      assertThat(prompt, containsString("tokens"))
      assertThat(prompt, containsString("Food & Dining"))
      assertThat(prompt, containsString("Amy Farrish"))
    })

    it("should cache the prompt after first load", () => {
      const prompt1 = loadSystemPrompt()
      const prompt2 = loadSystemPrompt()

      assertThat(prompt1, is(prompt2))
      assertThat(prompt1.length > 0, is(true))
    })

    it("should include all expected categories", () => {
      const prompt = loadSystemPrompt()

      assertThat(prompt, containsString("ATM Cash withdrawals"))
      assertThat(prompt, containsString("E-Transfer payment"))
      assertThat(prompt, containsString("Salary"))
      assertThat(prompt, containsString("Food & Dining"))
      assertThat(prompt, containsString("Transportation"))
      assertThat(prompt, containsString("Healthcare"))
    })

    it("should include keyword mappings", () => {
      const prompt = loadSystemPrompt()

      assertThat(prompt, containsString("Amy Farrish | Cleaning"))
      assertThat(prompt, containsString("Manulife | Healthcare"))
      assertThat(prompt, containsString("Deel | Salary"))
    })
  })
})
