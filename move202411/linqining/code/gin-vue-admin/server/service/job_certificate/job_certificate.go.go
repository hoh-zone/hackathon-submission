
package job_certificate

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job_certificate"
    job_certificateReq "github.com/flipped-aurora/gin-vue-admin/server/model/job_certificate/request"
)

type JobCertificateService struct {}
// CreateJobCertificate 创建职位资格要求记录
// Author [yourname](https://github.com/yourname)
func (jobCertificateService *JobCertificateService) CreateJobCertificate(jobCertificate *job_certificate.JobCertificate) (err error) {
	err = global.GVA_DB.Create(jobCertificate).Error
	return err
}

// DeleteJobCertificate 删除职位资格要求记录
// Author [yourname](https://github.com/yourname)
func (jobCertificateService *JobCertificateService)DeleteJobCertificate(ID string) (err error) {
	err = global.GVA_DB.Delete(&job_certificate.JobCertificate{},"id = ?",ID).Error
	return err
}

// DeleteJobCertificateByIds 批量删除职位资格要求记录
// Author [yourname](https://github.com/yourname)
func (jobCertificateService *JobCertificateService)DeleteJobCertificateByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]job_certificate.JobCertificate{},"id in ?",IDs).Error
	return err
}

// UpdateJobCertificate 更新职位资格要求记录
// Author [yourname](https://github.com/yourname)
func (jobCertificateService *JobCertificateService)UpdateJobCertificate(jobCertificate job_certificate.JobCertificate) (err error) {
	err = global.GVA_DB.Model(&job_certificate.JobCertificate{}).Where("id = ?",jobCertificate.ID).Updates(&jobCertificate).Error
	return err
}

// GetJobCertificate 根据ID获取职位资格要求记录
// Author [yourname](https://github.com/yourname)
func (jobCertificateService *JobCertificateService)GetJobCertificate(ID string) (jobCertificate job_certificate.JobCertificate, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&jobCertificate).Error
	return
}
// GetJobCertificateInfoList 分页获取职位资格要求记录
// Author [yourname](https://github.com/yourname)
func (jobCertificateService *JobCertificateService)GetJobCertificateInfoList(info job_certificateReq.JobCertificateSearch) (list []job_certificate.JobCertificate, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&job_certificate.JobCertificate{})
    var jobCertificates []job_certificate.JobCertificate
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }

	err = db.Find(&jobCertificates).Error
	return  jobCertificates, total, err
}
func (jobCertificateService *JobCertificateService)GetJobCertificatePublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
