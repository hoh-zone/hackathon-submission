package job_application

import (
	"errors"
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job_application"
	job_applicationReq "github.com/flipped-aurora/gin-vue-admin/server/model/job_application/request"
	"gorm.io/gorm"
)

type JobApplicationService struct{}

// CreateJobApplication 创建职位申请记录
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) CreateJobApplication(jobApplication *job_application.JobApplication) (err error) {
	err = global.GVA_DB.Create(jobApplication).Error
	return err
}

// DeleteJobApplication 删除职位申请记录
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) DeleteJobApplication(ID string) (err error) {
	err = global.GVA_DB.Delete(&job_application.JobApplication{}, "id = ?", ID).Error
	return err
}

// DeleteJobApplicationByIds 批量删除职位申请记录
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) DeleteJobApplicationByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]job_application.JobApplication{}, "id in ?", IDs).Error
	return err
}

// UpdateJobApplication 更新职位申请记录
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) UpdateJobApplication(jobApplication job_application.JobApplication) (err error) {
	err = global.GVA_DB.Model(&job_application.JobApplication{}).Where("id = ?", jobApplication.ID).Updates(&jobApplication).Error
	return err
}

// GetJobApplication 根据ID获取职位申请记录
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) GetJobApplication(ID string) (jobApplication job_application.JobApplication, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&jobApplication).Error
	return
}

// GetJobApplicationInfoList 分页获取职位申请记录
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) GetJobApplicationInfoList(info job_applicationReq.JobApplicationSearch) (list []job_application.JobApplication, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	// 创建db
	db := global.GVA_DB.Model(&job_application.JobApplication{})
	var jobApplications []job_application.JobApplication
	// 如果有条件搜索 下方会自动创建搜索语句
	if info.StartCreatedAt != nil && info.EndCreatedAt != nil {
		db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
	}
	if info.Address != nil && *info.Address != "" {
		db = db.Where("address = ?", *info.Address)
	}
	if info.Name != nil && *info.Name != "" {
		db = db.Where("name LIKE ?", "%"+*info.Name+"%")
	}
	if info.Phone != nil && *info.Phone != "" {
		db = db.Where("phone LIKE ?", "%"+*info.Phone+"%")
	}
	if info.JobId != nil {
		db = db.Where("job_id = ?", *info.JobId)
	}
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if limit != 0 {
		db = db.Limit(limit).Offset(offset)
	}

	err = db.Find(&jobApplications).Error
	return jobApplications, total, err
}
func (jobApplicationService *JobApplicationService) GetJobApplicationPublic() {
	// 此方法为获取数据源定义的数据
	// 请自行实现
}

// UserApply 申请职位
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) UserApply(jobApplication *job_application.JobApplication) (err error) {
	exist := job_application.JobApplication{}
	err = global.GVA_DB.Where("job_id = ? and address = ? ", jobApplication.JobId, jobApplication.Address).Find(&exist).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if exist.ID != 0 {
		return errors.New("record already exist")
	}
	err = global.GVA_DB.Create(jobApplication).Error
	return err
}

// UpdateDigest Offer交易摘要回填
// Author [yourname](https://github.com/yourname)
func (jobApplicationService *JobApplicationService) UpdateDigest(jobApplication job_application.JobApplication) (err error) {
	return jobApplicationService.UpdateJobApplication(jobApplication)
}
