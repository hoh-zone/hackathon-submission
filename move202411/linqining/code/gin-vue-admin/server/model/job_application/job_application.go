// 自动生成模板JobApplication
package job_application

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 职位申请 结构体  JobApplication
type JobApplication struct {
	global.GVA_MODEL
	Address      *string `json:"address" form:"address" gorm:"column:address;comment:;size:100;"`                  //申请人钱包地址
	Name         *string `json:"name" form:"name" gorm:"column:name;comment:;size:100;"`                           //申请人名字
	Introduction *string `json:"introduction" form:"introduction" gorm:"column:introduction;comment:;size:1000;"`  //自我介绍
	ResumeBlobId *string `json:"resumeBlobId" form:"resumeBlobId" gorm:"column:resume_blob_id;comment:;size:100;"` //简历blobID
	Phone        *string `json:"phone" form:"phone" gorm:"column:phone;comment:;size:50;"`                         //电话
	Email        *string `json:"email" form:"email" gorm:"column:email;comment:;size:100;"`                        //邮箱
	SuiObjectId  *string `json:"suiObjectId" form:"suiObjectId" gorm:"column:sui_object_id;comment:;size:100;"`    //简历ObjectId
	MediaType    *string `json:"mediaType" form:"mediaType" gorm:"column:media_type;comment:;size:20;"`            //文件类型
	JobId        *int    `json:"jobId" form:"jobId" gorm:"column:job_id;comment:;size:32;"`                        //JobID
	OfferDigest  *string `json:"offerDigest" form:"offerDigest" gorm:"column:offer_digest;comment:;size:100;"`     //offer交易摘要
}

// TableName 职位申请 JobApplication自定义表名 job_application
func (JobApplication) TableName() string {
	return "job_application"
}
