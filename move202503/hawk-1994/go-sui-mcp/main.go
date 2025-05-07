package main

import (
	"log"

	"github.com/krli/go-sui-mcp/cmd"
)

func main() {
	// Execute the root command
	if err := cmd.Execute(); err != nil {
		log.Fatalf("Error executing command: %v", err)
	}
}
