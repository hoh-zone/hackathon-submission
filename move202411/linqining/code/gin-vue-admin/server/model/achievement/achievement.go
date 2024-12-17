// 自动生成模板Achievement
package achievement

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 成就 结构体  Achievement
type Achievement struct {
	global.GVA_MODEL
	Name         *string `json:"name" form:"name" gorm:"column:name;comment:;size:100;" binding:"required"`       //名称
	Image        *string `json:"image" form:"image" gorm:"column:image;comment:;size:100;" binding:"required"`    //图片
	ObjectID     *string `json:"objectID" form:"objectID" gorm:"column:object_id;comment:;size:100;"`             //ObjectID
	Digest       *string `json:"digest" form:"digest" gorm:"column:digest;comment:;size:100;"`                    //digest
	OwnerAddress *string `json:"ownerAddress" form:"ownerAddress" gorm:"column:owner_address;comment:;size:100;"` //持有人地址
}

// TableName 成就 Achievement自定义表名 achievement
func (Achievement) TableName() string {
	return "achievement"
}
