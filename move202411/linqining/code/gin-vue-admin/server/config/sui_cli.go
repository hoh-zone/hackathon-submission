package config

type SuiCli struct {
	Endpoint string `mapstructure:"endpoint" json:"endpoint" yaml:"endpoint"` // 代表当前实例的名字
}
