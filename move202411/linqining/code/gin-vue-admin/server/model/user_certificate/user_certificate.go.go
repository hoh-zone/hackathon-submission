
// 自动生成模板UserCertificate
package user_certificate
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 用户资质 结构体  UserCertificate
type UserCertificate struct {
    global.GVA_MODEL
    UserId  *int `json:"userId" form:"userId" gorm:"column:user_id;comment:;size:10;" binding:"required"`  //UserId 
    CertificateId  *int `json:"certificateId" form:"certificateId" gorm:"column:certificate_id;comment:;size:10;" binding:"required"`  //CertificateId 
}


// TableName 用户资质 UserCertificate自定义表名 user_certificate
func (UserCertificate) TableName() string {
    return "user_certificate"
}





