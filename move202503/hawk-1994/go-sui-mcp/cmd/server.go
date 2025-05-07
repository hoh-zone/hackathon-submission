package cmd

import (
	"fmt"
	"log"

	"github.com/krli/go-sui-mcp/internal/services"
	"github.com/krli/go-sui-mcp/internal/sui"
	"github.com/mark3labs/mcp-go/server"

	// "github.com/mark3labs/mcp-go/mcp"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	port int
	sse  bool
)

// serverCmd represents the server command
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the MCP server",
	Long:  `Start the Management Control Plane server to handle Sui client operations.`,
	Run: func(cmd *cobra.Command, args []string) {
		startServer(port, sse)
	},
}

func init() {
	rootCmd.AddCommand(serverCmd)

	// Local flags for the server command
	serverCmd.Flags().IntVar(&port, "port", 8080, "Port to run the server on")
	serverCmd.Flags().BoolVar(&sse, "sse", false, "Enable SSE")
	viper.BindPFlag("server.port", serverCmd.Flags().Lookup("port"))
	viper.BindPFlag("server.sse", serverCmd.Flags().Lookup("sse"))
}

func registerHandlers(s *server.MCPServer, suiTools *services.SuiTools, suiService *services.SuiService) {
	s.AddTool(suiTools.GetFormattedVersion(), suiService.GetFormattedVersion)
	s.AddTool(suiTools.GetSuiPath(), suiService.GetSuiPath)
	s.AddTool(suiTools.GetBalanceSummary(), suiService.GetBalanceSummary)
	s.AddTool(suiTools.GetObjectsSummary(), suiService.GetObjectsSummary)
	s.AddTool(suiTools.GetObject(), suiService.GetObject)
	s.AddTool(suiTools.ProcessTransaction(), suiService.ProcessTransaction)
	s.AddTool(suiTools.PaySUI(), suiService.PaySUI)

}

func startServer(port int, sse bool) {
	// Create a new Sui client

	// Create a new Sui client
	suiClient := sui.NewClient()

	// Create service layer
	suiService := services.NewSuiService(suiClient)
	suiTools := services.NewSuiTools()
	s := server.NewMCPServer(
		"SUI MCP",
		"1.0.0",
	)
	registerHandlers(s, suiTools, suiService)
	if sse {
		sseServer := server.NewSSEServer(s, server.WithBaseURL(fmt.Sprintf("http://localhost:%d", port)))
		if err := sseServer.Start(fmt.Sprintf(":%d", port)); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	} else {
		if err := server.ServeStdio(s); err != nil {
			log.Fatalf("Server error: %v", err)
		}
	}
}
