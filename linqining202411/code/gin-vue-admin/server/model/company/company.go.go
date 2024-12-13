
// 自动生成模板Company
package company
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 公司 结构体  Company
type Company struct {
    global.GVA_MODEL
    WalletAddress  *string `json:"walletAddress" form:"walletAddress" gorm:"uniqueIndex;column:wallet_address;comment:;size:100;"`  //地址 
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;size:100;"`  //公司名 
    Status  *int `json:"status" form:"status" gorm:"column:status;comment:;"`  //状态 
}


// TableName 公司 Company自定义表名 company
func (Company) TableName() string {
    return "company"
}





