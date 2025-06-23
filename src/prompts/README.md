# System Prompts

This directory contains the system prompts used by the AI categorizers.

## Files

- `categorization-system-prompt.txt` - The shared system prompt used by both OpenAI and Anthropic categorizers

## Editing the System Prompt

To modify the categorization behavior for both AI models:

1. Edit `categorization-system-prompt.txt`
2. Update categories, keywords, or instructions as needed
3. The changes will automatically apply to both OpenAI and Anthropic categorizers
4. No code changes needed - the prompt is loaded dynamically

## Prompt Structure

The system prompt includes:

- **Role definition**: Defines the AI as a financial transaction categorizer
- **Task description**: Explains what tokens are and how to use them
- **Category list**: Standard categories for transaction classification
- **Keyword mappings**: Specific keywords that map to particular categories
- **Response format**: Instructions to return only the category name

## Adding New Categories

To add a new category:

1. Add it to the "Suggested categories" list
2. Optionally add keyword mappings in the table
3. Test with sample transactions to verify categorization

## Adding Keyword Mappings

To map specific keywords to categories:

1. Add a new row to the keyword mapping table
2. Format: `| Keywords | Category |`
3. Use the exact category name from the suggested categories list

The keyword mappings help the AI recognize specific merchants, payees, or transaction patterns that should always be categorized the same way. 