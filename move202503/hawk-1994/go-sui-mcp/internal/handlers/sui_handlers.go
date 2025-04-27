package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/krli/go-sui-mcp/internal/services"
	"github.com/krli/go-sui-mcp/internal/sui"
)

// RegisterSuiHandlers registers all Sui-related API handlers with the Gin router
func RegisterSuiHandlers(router *gin.Engine, client *sui.Client, service *services.SuiService) {
	// Group all Sui APIs under the /api/sui path
	suiAPI := router.Group("/api/sui")
	{
		suiAPI.GET("/version", getVersion(client, service))
		suiAPI.GET("/balance/:address", getBalance(client, service))
		suiAPI.GET("/objects/:address", getObjects(client, service))
		suiAPI.GET("/validators", getActiveValidators(client))
		suiAPI.GET("/network", getNetwork(client))
		suiAPI.GET("/transaction/:txid", getTransaction(client, service))
		suiAPI.POST("/transfer", transferSUI(client, service))
	}
}

// getVersion returns the Sui client version
func getVersion(client *sui.Client, service *services.SuiService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use the service instead of direct client call
		version, err := service.GetFormattedVersion()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"version": version,
		})
	}
}

// getBalance returns the balance for a specific address
func getBalance(client *sui.Client, service *services.SuiService) gin.HandlerFunc {
	return func(c *gin.Context) {
		address := c.Param("address")
		if address == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "address is required",
			})
			return
		}

		// Try to use the service for a more structured response
		summary, err := service.GetBalanceSummary(address)
		if err != nil {
			// Fallback to direct client call
			output, err := client.GetBalance(address)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": err.Error(),
				})
				return
			}

			// Try to parse the output as JSON, if it fails, return as text
			var result interface{}
			if err := json.Unmarshal([]byte(output), &result); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"data": strings.TrimSpace(output),
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"data": result,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": summary,
		})
	}
}

// getObjects returns objects owned by an address
func getObjects(client *sui.Client, service *services.SuiService) gin.HandlerFunc {
	return func(c *gin.Context) {
		address := c.Param("address")
		if address == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "address is required",
			})
			return
		}

		// Try to use the service
		objects, err := service.GetObjectsSummary(address)
		if err != nil {
			// Fallback to direct client call
			output, err := client.GetObjects(address)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": err.Error(),
				})
				return
			}

			// Try to parse the output as JSON, if it fails, return as text
			var result interface{}
			if err := json.Unmarshal([]byte(output), &result); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"data": strings.TrimSpace(output),
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"data": result,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": objects,
		})
	}
}

// getActiveValidators returns the list of active validators
func getActiveValidators(client *sui.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		output, err := client.GetActiveValidators()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		// Try to parse the output as JSON, if it fails, return as text
		var result interface{}
		if err := json.Unmarshal([]byte(output), &result); err != nil {
			c.JSON(http.StatusOK, gin.H{
				"data": strings.TrimSpace(output),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": result,
		})
	}
}

// getNetwork returns the current network info
func getNetwork(client *sui.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		output, err := client.GetNetwork()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		// Try to parse the output as JSON, if it fails, return as text
		var result interface{}
		if err := json.Unmarshal([]byte(output), &result); err != nil {
			c.JSON(http.StatusOK, gin.H{
				"data": strings.TrimSpace(output),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": result,
		})
	}
}

// getTransaction returns information about a specific transaction
func getTransaction(client *sui.Client, service *services.SuiService) gin.HandlerFunc {
	return func(c *gin.Context) {
		txID := c.Param("txid")
		if txID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "transaction ID is required",
			})
			return
		}

		// Use the service
		result, err := service.ProcessTransaction(txID)
		if err != nil {
			// Fall back to direct client call
			output, err := client.GetTransaction(txID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": err.Error(),
				})
				return
			}

			// Try to parse the output as JSON, if it fails, return as text
			var result interface{}
			if err := json.Unmarshal([]byte(output), &result); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"data": strings.TrimSpace(output),
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"data": result,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": result,
		})
	}
}

// transferSUI transfers SUI tokens to a recipient
func transferSUI(client *sui.Client, service *services.SuiService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			Recipient string `json:"recipient" binding:"required"`
			Amount    string `json:"amount" binding:"required"`
			GasBudget string `json:"gas_budget"`
		}

		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
			return
		}

		// Convert amount to uint64
		amount, err := strconv.ParseUint(request.Amount, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid amount: " + err.Error(),
			})
			return
		}

		// Use the service
		result, err := service.TransferTokens(request.Recipient, amount, request.GasBudget)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data": result,
		})
	}
}
