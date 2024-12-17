package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
	"time"
)

type JobApplicationSearch struct {
	StartCreatedAt *time.Time `json:"startCreatedAt" form:"startCreatedAt"`
	EndCreatedAt   *time.Time `json:"endCreatedAt" form:"endCreatedAt"`
	Address        *string    `json:"address" form:"address" `
	Name           *string    `json:"name" form:"name" `
	Phone          *string    `json:"phone" form:"phone" `
	JobId          *int       `json:"jobId" form:"jobId" `
	request.PageInfo
}
