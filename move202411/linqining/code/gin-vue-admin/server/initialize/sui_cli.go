package initialize

import (
	"github.com/block-vision/sui-go-sdk/sui"
	"github.com/flipped-aurora/gin-vue-admin/server/config"
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

func initSuiClient(suiCfg config.SuiCli) sui.ISuiAPI {
	cli := sui.NewSuiClient(suiCfg.Endpoint)
	return cli
}

func SuiClient() {
	global.SuiClient = initSuiClient(global.GVA_CONFIG.SuiCli)
}
