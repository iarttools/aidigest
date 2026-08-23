# Put aidigest to work in your repository

aidigest becomes more useful when it leaves the demo and helps a real project. You can add it without giving it an API key or sending repository contents to a hosted service.

## A five-minute experiment

1. Add the `aidigest Context Receipt` Action to a pull request workflow.
2. Choose the folders that contain documentation or other context your agents read.
3. Open a pull request.
4. The Action posts a compact receipt with the estimated input size, removable noise, possible prompt-injection signals, and the resulting reduction.
5. Use that receipt to decide whether a page needs editing, splitting, or a smaller context budget.

Example:

```yaml
name: Context receipt

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  aidigest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: iarttools/aidigest@main
        with:
          paths: README.md,docs
```

The Action is intentionally local and deterministic. It is a useful signal, not a claim that every page can be reduced by the same percentage. Read the receipt before changing content: shortening a document is only good when the important meaning remains.

## Make the result visible

Link the public demo from your project, share a before/after receipt in a Discussion, or open an issue with a difficult page. Small, reproducible examples help the extractor improve more than generic praise.

## Manual mode

If a project, agent, or corporate policy does not allow automatic proxy configuration, use aidigest in manual mode and call the CLI, MCP server, or proxy explicitly. Automatic mode is a convenience, not a requirement.

