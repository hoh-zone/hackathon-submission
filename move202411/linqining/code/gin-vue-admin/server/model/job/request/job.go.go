package request

import (
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/request"
)

type JobSearch struct {
	request.PageInfo
	SalaryBottom *int `json:"salaryBottom" form:"salaryBottom" `
	SalaryCeil   *int `json:"salaryCeil" form:"salaryCeil" `
}
