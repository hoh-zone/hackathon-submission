package services

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/krli/go-sui-mcp/internal/sui"
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
func (s *SuiService) GetFormattedVersion() (string, error) {
	version, err := s.client.GetVersion()
	if err != nil {
		return "", err
	}

	// Clean up the version string
	return strings.TrimSpace(version), nil
}

// GetBalanceSummary returns a summary of the balance for an address
type BalanceSummary struct {
	Address     string `json:"address"`
	TotalCoins  uint64 `json:"total_coins"`
	CoinCount   int    `json:"coin_count"`
	CoinObjects []any  `json:"coin_objects"`
}

// GetBalanceSummary returns a structured summary of the balance for an address
func (s *SuiService) GetBalanceSummary(address string) (*BalanceSummary, error) {
	output, err := s.client.GetBalance(address)
	if err != nil {
		return nil, err
	}

	// Try to parse the output as JSON
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		return nil, fmt.Errorf("failed to parse balance output: %w", err)
	}

	// Extract coin objects
	coinObjects, ok := result["result"]
	if !ok {
		return nil, fmt.Errorf("unexpected response format, missing result")
	}

	// Create a summary
	summary := &BalanceSummary{
		Address:     address,
		CoinObjects: []any{coinObjects},
	}

	// Additional processing could be done here

	return summary, nil
}

// GetObjectsSummary gets a summary of objects owned by an address
func (s *SuiService) GetObjectsSummary(address string) (interface{}, error) {
	output, err := s.client.GetObjects(address)
	if err != nil {
		return nil, err
	}

	// Try to parse the output as JSON
	var result interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		return nil, fmt.Errorf("failed to parse objects output: %w", err)
	}

	return result, nil
}

// ProcessTransaction processes a transaction and returns readable information
func (s *SuiService) ProcessTransaction(txID string) (interface{}, error) {
	output, err := s.client.GetTransaction(txID)
	if err != nil {
		return nil, err
	}

	// Try to parse the output as JSON
	var result interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		return strings.TrimSpace(output), nil
	}

	return result, nil
}

// TransferTokens transfers tokens and returns the transaction result
func (s *SuiService) TransferTokens(recipient string, amount uint64, gasBudget string) (interface{}, error) {
	output, err := s.client.TransferSUI(recipient, amount, gasBudget)
	if err != nil {
		return nil, err
	}

	// Try to parse the output as JSON
	var result interface{}
	if err := json.Unmarshal([]byte(output), &result); err != nil {
		return strings.TrimSpace(output), nil
	}

	return result, nil
}
