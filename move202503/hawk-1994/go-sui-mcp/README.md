# Go Sui MCP (Management Control Plane)

A Go-based management control plane server for Sui blockchain, providing MCP (Management Control Plane) tools to interact with local Sui client commands. This project integrates with Cursor IDE for enhanced development experience.

## Features

- MCP tools for Sui client operations
- Support for both stdio and SSE (Server-Sent Events) modes
- Integration with Cursor IDE
- Configuration via config file, environment variables, or command-line flags

## Prerequisites

- Go 1.20 or higher
- Sui client installed and available in PATH
- Cursor IDE (for development)

## Installation

```bash
# Clone the repository
git clone https://github.com/krli/go-sui-mcp.git
cd go-sui-mcp

# Build the application
go build -o go-sui-mcp
```

## Configuration

Configuration can be done via:

1. Config file (default: `$HOME/.go-sui-mcp.yaml`)
2. Environment variables
3. Command-line flags

Example config file:

```yaml
server:
  port: 8080
  sse: false
sui:
  executable_path: "sui"
```

Environment variables:

```bash
GOSUI_SERVER_PORT=8080
GOSUI_SERVER_SSE=false
GOSUI_SUI_EXECUTABLE_PATH=sui
```

## Running the Server

The server can be run in two modes:

1. stdio mode (default):
```bash
./go-sui-mcp server
```

2. SSE mode:
```bash
./go-sui-mcp server --sse --port 8080
```

## Cursor IDE Integration

To integrate with Cursor IDE, create a `.cursor/mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "sui-sse": {
      "command": "/path/to/go-sui-mcp",
      "args": ["server", "--sse"]
    },
    "sui-dev": {
      "url": "http://localhost:8080/sse"
    },
    "sui": {
      "command": "/path/to/go-sui-mcp",
      "args": ["server"]
    }
  }
}
```

## Available MCP Tools

The following MCP tools are available:

### Version and Path
- `sui-formatted-version`: Get the formatted version of the Sui client
- `sui-path`: Get the path of the local sui binary

### Balance and Objects
- `sui-balance-summary`: Get the balance summary of an address
- `sui-objects-summary`: Get the objects summary of an address
- `sui-object`: Get details of a specific object

### Transactions
- `sui-process-transaction`: Process and get details of a transaction
- `sui-pay-sui`: Transfer SUI tokens to a recipient

### Example Tool Usage (in Cursor)

Transfer SUI tokens:
```typescript
await mcp.invoke("sui-pay-sui", {
  recipient: "0x...",
  amounts: 1000000000, // 1 SUI
  "gas-budget": "2000000",
  "input-coins": "0x..."
});
```

Get balance summary:
```typescript
await mcp.invoke("sui-balance-summary", {
  address: "0x..." // optional, uses current address if not provided
});
```

## Development

The project uses the following key components:

- `internal/sui`: Core Sui client implementation
- `internal/services`: MCP tools and service implementations
- `cmd`: Command-line interface implementation

## License

See [LICENSE](LICENSE) file.