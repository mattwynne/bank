import * as fs from "fs"
import * as path from "path"

let cachedSystemPrompt: string | null = null

export function loadSystemPrompt(): string {
  if (cachedSystemPrompt === null) {
    const promptPath = path.join(
      __dirname,
      "../prompts/categorization-system-prompt.txt"
    )
    cachedSystemPrompt = fs.readFileSync(promptPath, "utf-8").trim()
  }
  return cachedSystemPrompt
}
