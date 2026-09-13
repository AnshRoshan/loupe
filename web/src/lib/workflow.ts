export const workflow = `name: Loupe code review
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
permissions:
  contents: read
  pull-requests: write
  issues: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anshace/loupe@v1
        with:
          llm-api-key: \u0024{{ secrets.LLM_API_KEY }}
          provider: openai
          model: gpt-4o-mini`;
