
package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"time"
)

type AchievementLogSearch struct{
    StartCreatedAt *time.Time `json:"startCreatedAt" form:"startCreatedAt"`
    EndCreatedAt   *time.Time `json:"endCreatedAt" form:"endCreatedAt"`
    Receiver_address  *string `json:"receiver_address" form:"receiver_address" `
    Sender_address  *string `json:"sender_address" form:"sender_address" `
    StartSui_amount  *int  `json:"startSui_amount" form:"startSui_amount"`
    EndSui_amount  *int  `json:"endSui_amount" form:"endSui_amount"`
    request.PageInfo
}
