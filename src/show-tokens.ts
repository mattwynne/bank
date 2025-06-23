#!/usr/bin/env node

import { CsvTransactionReader } from "./adapters/csv-transaction-reader"

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 1) {
    console.error("Usage: npm run show-tokens <input-file>")
    process.exit(1)
  }

  const inputFilePath = args[0]

  try {
    console.log(`Reading transactions from ${inputFilePath}...`)
    console.log("")

    const reader = new CsvTransactionReader(inputFilePath)
    const transactions = await reader.readTransactions()

    console.log(`Found ${transactions.length} transactions:`)
    console.log("")

    transactions.forEach((transaction, index) => {
      const tokens = transaction.tokens()
      console.log(`${index + 1}. ${transaction.description.value}`)
      console.log(`   Amount: ${transaction.amount.value}`)
      console.log(
        `   Tokens: [${tokens.map((token) => `"${token}"`).join(", ")}]`
      )
      console.log("")
    })
  } catch (error) {
    console.error("Error reading transactions:", error)
    process.exit(1)
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main()
}
