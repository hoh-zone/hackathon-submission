package cmd

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/krli/go-sui-mcp/internal/config"
	"github.com/krli/go-sui-mcp/internal/handlers"
	"github.com/krli/go-sui-mcp/internal/services"
	"github.com/krli/go-sui-mcp/internal/sui"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	port int
)

// serverCmd represents the server command
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the MCP server",
	Long:  `Start the Management Control Plane server to handle Sui client operations.`,
	Run: func(cmd *cobra.Command, args []string) {
		startServer()
	},
}

func init() {
	rootCmd.AddCommand(serverCmd)

	// Local flags for the server command
	serverCmd.Flags().IntVar(&port, "port", 8080, "Port to run the server on")
	viper.BindPFlag("server.port", serverCmd.Flags().Lookup("port"))
}

func startServer() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Create a new Sui client
	suiClient := sui.NewClient()

	// Create service layer
	suiService := services.NewSuiService(suiClient)

	// Initialize the Gin router
	router := gin.Default()

	// Register routes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Register Sui client API handlers
	handlers.RegisterSuiHandlers(router, suiClient, suiService)

	// Start the server
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Starting server on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
