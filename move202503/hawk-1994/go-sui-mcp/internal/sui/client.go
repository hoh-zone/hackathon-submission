package sui

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"github.com/spf13/viper"
)

// Client provides methods to interact with the Sui client CLI
type Client struct {
	executablePath string
}

// NewClient creates a new Sui client instance
func NewClient() *Client {
	// Use the configured executable path or default to "sui"
	execPath := viper.GetString("sui.executable_path")
	if execPath == "" {
		execPath = "sui"
	}

	return &Client{
		executablePath: execPath,
	}
}

// ExecuteCommand runs a Sui command and returns the output
func (c *Client) ExecuteCommand(args ...string) (string, error) {
	cmd := exec.Command(c.executablePath, args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("error executing sui command: %v\nStderr: %s", err, stderr.String())
	}

	return stdout.String(), nil
}

// GetVersion returns the Sui client version
func (c *Client) GetVersion() (string, error) {
	output, err := c.ExecuteCommand("--version")
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(output), nil
}

// GetBalance gets the balance for a specific address
func (c *Client) GetBalance(address string) (string, error) {
	args := []string{"client", "gas", "--address", address}
	return c.ExecuteCommand(args...)
}

// GetObjects gets objects owned by an address
func (c *Client) GetObjects(address string) (string, error) {
	args := []string{"client", "objects", "--address", address}
	return c.ExecuteCommand(args...)
}

// GetActiveValidators gets the list of active validators
func (c *Client) GetActiveValidators() (string, error) {
	args := []string{"client", "active-validators"}
	return c.ExecuteCommand(args...)
}

// GetNetwork returns the current network info
func (c *Client) GetNetwork() (string, error) {
	args := []string{"client", "envs"}
	return c.ExecuteCommand(args...)
}

// GetTransaction retrieves information about a specific transaction
func (c *Client) GetTransaction(txID string) (string, error) {
	args := []string{"client", "transaction", txID}
	return c.ExecuteCommand(args...)
}

// TransferSUI transfers SUI tokens to a recipient
func (c *Client) TransferSUI(recipient string, amount uint64, gasOption string) (string, error) {
	args := []string{"client", "transfer-sui", "--to", recipient, "--amount", fmt.Sprintf("%d", amount)}

	if gasOption != "" {
		args = append(args, "--gas-budget", gasOption)
	}

	return c.ExecuteCommand(args...)
}
