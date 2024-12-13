
// 自动生成模板User
package user
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 用户 结构体  User
type User struct {
    global.GVA_MODEL
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;size:100;"`  //用户名 
    Address  *string `json:"address" form:"address" gorm:"column:address;comment:;size:100;" binding:"required"`  //钱包地址 
    Avatar  *string `json:"avatar" form:"avatar" gorm:"column:avatar;comment:;size:100;"`  //头像 
}


// TableName 用户 User自定义表名 user
func (User) TableName() string {
    return "user"
}





