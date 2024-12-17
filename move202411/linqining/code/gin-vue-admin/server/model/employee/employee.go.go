// 自动生成模板Employee
package employee

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 员工信息 结构体  Employee
type Employee struct {
	global.GVA_MODEL
	UserId           *int    `json:"userId" form:"userId" gorm:"column:user_id;comment:;size:10;"`                                 //用户id
	CompanyId        *int    `json:"companyId" form:"companyId" gorm:"column:company_id;comment:;size:10;"`                        //CompanyId
	Digest           *string `json:"digest" form:"digest" gorm:"column:digest;comment:;size:100;"`                                 //合同交易摘要
	ContractObjectId *string `json:"contractObjectId" form:"contractObjectId" gorm:"column:contract_object_id;comment:;size:100;"` //合同ObjectID
}

// TableName 员工信息 Employee自定义表名 employee
func (Employee) TableName() string {
	return "employee"
}
