package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config contains all the configuration for the application
type Config struct {
	Server ServerConfig `mapstructure:"server"`
	Sui    SuiConfig    `mapstructure:"sui"`
}

// ServerConfig contains settings for the HTTP server
type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Host string `mapstructure:"host"`
}

// SuiConfig contains settings for the Sui client
type SuiConfig struct {
	ExecutablePath string `mapstructure:"executable_path"`
}

// Load loads the configuration from viper
func Load() (*Config, error) {
	var config Config

	// Set default values
	setDefaults()

	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &config, nil
}

// setDefaults sets default values for configuration items
func setDefaults() {
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("sui.executable_path", "sui")
}
