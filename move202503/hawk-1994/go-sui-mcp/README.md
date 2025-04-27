# Go Sui MCP (Management Control Plane)

A Go-based management control plane server for Sui blockchain, providing REST APIs to interact with local Sui client commands.

## Features

- RESTful API for Sui client operations
- Command-line interface for server control
- Configuration via config file, environment variables, or command-line flags

## Prerequisites

- Go 1.20 or higher
- Sui client installed and available in PATH

## Installation

```bash
# Clone the repository
git clone https://github.com/krli/go-sui-mcp.git
cd go-sui-mcp

# Build the application
go build -o go-sui-mcp

# Run the server
./go-sui-mcp server
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
  host: "0.0.0.0"
sui:
  executable_path: "sui"
```

Environment variables:

```bash
GOSUI_SERVER_PORT=8080
GOSUI_SERVER_HOST=0.0.0.0
GOSUI_SUI_EXECUTABLE_PATH=sui
```

## API Endpoints

### Health Check

```
GET /health
```

### Sui Client APIs

```
GET /api/sui/version                 # Get Sui client version
GET /api/sui/balance/:address        # Get balance for an address
GET /api/sui/objects/:address        # Get objects owned by an address
GET /api/sui/validators              # Get active validators
GET /api/sui/network                 # Get network info
GET /api/sui/transaction/:txid       # Get transaction information
POST /api/sui/transfer               # Transfer SUI tokens
```

### POST /api/sui/transfer
Request body:
```json
{
  "recipient": "0x123456789abcdef",
  "amount": "1000000000",
  "gas_budget": "10000"
}
```

## Examples

Get Sui version:

```bash
curl http://localhost:8080/api/sui/version
```

Get balance for address:

```bash
curl http://localhost:8080/api/sui/balance/0x123456789abcdef
```

## License

See [LICENSE](LICENSE) file.