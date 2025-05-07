package services

import (
	"strings"

	"context"
	"errors"

	"github.com/krli/go-sui-mcp/internal/sui"
	"github.com/mark3labs/mcp-go/mcp"
)

// SuiService provides higher-level operations on the Sui blockchain
type SuiService struct {
	client *sui.Client
}

// NewSuiService creates a new Sui service
func NewSuiService(client *sui.Client) *SuiService {
	return &SuiService{
		client: client,
	}
}

// GetFormattedVersion returns a cleaned version string
func (s *SuiService) GetFormattedVersion(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	version, err := s.client.GetVersion()
	if err != nil {
		return nil, err
	}

	// Clean up the version string
	return mcp.NewToolResultText(strings.TrimSpace(version)), nil
}

func (s *SuiService) GetSuiPath(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	path, err := s.client.GetSuiPath()
	if err != nil {
		return nil, err
	}
	return mcp.NewToolResultText(path), nil
}

// GetBalanceSummary returns a summary of the balance for an address
type BalanceSummary struct {
	Address     string `json:"address"`
	TotalCoins  uint64 `json:"total_coins"`
	CoinCount   int    `json:"coin_count"`
	CoinObjects []any  `json:"coin_objects"`
}

// GetBalanceSummary returns a structured summary of the balance for an address
func (s *SuiService) GetBalanceSummary(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	address, _ := request.Params.Arguments["address"].(string)
	output, err := s.client.GetBalance(address)
	if err != nil {
		return nil, err
	}

	return mcp.NewToolResultText(output), nil
}

// GetObjectsSummary gets a summary of objects owned by an address
func (s *SuiService) GetObjectsSummary(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	address, _ := request.Params.Arguments["address"].(string)

	output, err := s.client.GetObjects(address)
	if err != nil {
		return nil, err
	}

	return mcp.NewToolResultText(output), nil
}

// GetObject processes a transaction and returns readable information
func (s *SuiService) GetObject(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	objectID, ok := request.Params.Arguments["objectID"].(string)
	if !ok {
		return nil, errors.New("objectID must be a string")
	}
	output, err := s.client.GetObject(objectID)
	if err != nil {
		return nil, err
	}

	return mcp.NewToolResultText(output), nil
}

// ProcessTransaction processes a transaction and returns readable information
func (s *SuiService) ProcessTransaction(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	txID, ok := request.Params.Arguments["txID"].(string)
	if !ok {
		return nil, errors.New("txID must be a string")
	}
	output, err := s.client.GetTransaction(txID)
	if err != nil {
		return nil, err
	}

	return mcp.NewToolResultText(output), nil
}

// PaySUI transfers tokens and returns the transaction result
func (s *SuiService) PaySUI(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	recipient, ok := request.Params.Arguments["recipient"].(string)
	if !ok {
		return nil, errors.New("recipient must be a string")
	}
	amountFloat, ok := request.Params.Arguments["amounts"].(float64)
	if !ok {
		return nil, errors.New("amounts must be a number")
	}
	amounts := uint64(amountFloat)

	inputCoins, ok := request.Params.Arguments["input-coins"].(string)
	if !ok {
		return nil, errors.New("inputCoins must be a string")
	}

	gasBudget, ok := request.Params.Arguments["gas-budget"].(string)
	if !ok {
		return nil, errors.New("gasBudget must be a string")
	}
	output, err := s.client.PaySUI(recipient, inputCoins, amounts, gasBudget)
	if err != nil {
		return nil, err
	}

	return mcp.NewToolResultText(output), nil
}
