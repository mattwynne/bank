import { Application, processTransactions } from "./application"

async function exampleUsage() {
  console.log("Example 1: Using the Application class directly")

  const app = new Application({
    inputFilePath: "tmp/cibc.csv",
    outputFilePath: "categorized-transactions.csv",
    openAiApiKey: process.env.OPENAI_API_KEY || "your-openai-api-key",
  })

  // await app.run()

  console.log("\nExample 2: Using the convenience function")

  // await processTransactions({
  //   inputFilePath: "cibc.csv",
  //   outputFilePath: "categorized-transactions.csv",
  //   openAiApiKey: process.env.OPENAI_API_KEY || "your-openai-api-key",
  // })

  console.log("\nTo run this example:")
  console.log("1. Set your OpenAI API key: export OPENAI_API_KEY=your-key-here")
  console.log("2. Place your CSV file as 'cibc.csv' in the project root")
  console.log("3. Uncomment the await statements above")
  console.log("4. Run: ts-node src/example.ts")
}

exampleUsage().catch(console.error)
