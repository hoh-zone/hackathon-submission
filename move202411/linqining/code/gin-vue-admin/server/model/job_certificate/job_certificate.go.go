
// 自动生成模板JobCertificate
package job_certificate
import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 职位资格要求 结构体  JobCertificate
type JobCertificate struct {
    global.GVA_MODEL
    JobId  *int `json:"jobId" form:"jobId" gorm:"column:job_id;comment:;size:10;" binding:"required"`  //jobid 
    CertificateId  *int `json:"certificateId" form:"certificateId" gorm:"column:certificate_id;comment:;size:100;" binding:"required"`  //资质ID 
}


// TableName 职位资格要求 JobCertificate自定义表名 job_certificate
func (JobCertificate) TableName() string {
    return "job_certificate"
}





