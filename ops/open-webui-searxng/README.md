# Open WebUI + SearXNG

This stack adds local web search to LM Studio without changing the main `aishow` service.

## Ports

- Open WebUI: `http://localhost:3001`
- SearXNG: `http://localhost:8081`
- LM Studio API: `http://localhost:1234/v1`

## Start

```bash
cd ops/open-webui-searxng
docker compose up -d
```

## Stop

```bash
cd ops/open-webui-searxng
docker compose down
```

## First Use

1. Open `http://localhost:3001`
2. Create the first admin account
3. Pick the LM Studio model from the model selector
4. Use the `+` button in the chat box to turn on `Web Search`

## Notes

- This stack uses `host.docker.internal` to connect from Open WebUI to LM Studio running on macOS.
- SearXNG has JSON output enabled so Open WebUI can consume search results correctly.
- If model loading feels slow, make sure LM Studio already has `gemma-4-e4b-it` loaded before opening Open WebUI.
