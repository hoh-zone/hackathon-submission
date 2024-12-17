package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"time"
)

type AchievementSearch struct {
	StartCreatedAt *time.Time `json:"startCreatedAt" form:"startCreatedAt"`
	EndCreatedAt   *time.Time `json:"endCreatedAt" form:"endCreatedAt"`
	Name           *string    `json:"name" form:"name" `
	OwnerAddress   *string    `json:"ownerAddress" form:"ownerAddress"` //持有人地址
	request.PageInfo
}
