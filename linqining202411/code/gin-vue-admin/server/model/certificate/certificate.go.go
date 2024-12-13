
// 自动生成模板Certificate
package certificate
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 资质 结构体  Certificate
type Certificate struct {
    global.GVA_MODEL
    ObjectId  *string `json:"objectId" form:"objectId" gorm:"column:object_id;comment:;size:100;"`  //sui objectID 
    Name  *string `json:"name" form:"name" gorm:"column:name;comment:;size:100;"`  //名称 
    Address  *string `json:"address" form:"address" gorm:"column:address;comment:;size:100;"`  //地址 
    ImageUrl  *string `json:"imageUrl" form:"imageUrl" gorm:"column:image_url;comment:;size:100;"`  //图片 
}


// TableName 资质 Certificate自定义表名 certificate
func (Certificate) TableName() string {
    return "certificate"
}





