package job

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job"
	jobReq "github.com/flipped-aurora/gin-vue-admin/server/model/job/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate"
	"github.com/google/martian/log"
	"go.uber.org/zap"
)

type JobService struct{}

// CreateJob 创建职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) CreateJob(job_info *job.Job) (err error) {
	err = global.GVA_DB.Create(job_info).Error
	return err
}

// DeleteJob 删除职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) DeleteJob(id string) (err error) {
	err = global.GVA_DB.Delete(&job.Job{}, "id = ?", id).Error
	return err
}

// DeleteJobByIds 批量删除职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) DeleteJobByIds(ids []string) (err error) {
	err = global.GVA_DB.Delete(&[]job.Job{}, "id in ?", ids).Error
	return err
}

// UpdateJob 更新职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) UpdateJob(job_info job.Job) (err error) {
	err = global.GVA_DB.Model(&job.Job{}).Where("id = ?", job_info.Id).Updates(&job_info).Error
	return err
}

// GetJob 根据id获取职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) GetJob(id string) (job_info job.Job, err error) {
	err = global.GVA_DB.Where("id = ?", id).First(&job_info).Error
	return
}

// GetJobInfoList 分页获取职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) GetJobInfoList(info jobReq.JobSearch) (list []job.Job, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	// 创建db
	db := global.GVA_DB.Model(&job.Job{})
	var job_infos []job.Job
	// 如果有条件搜索 下方会自动创建搜索语句
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if limit != 0 {
		db = db.Limit(limit).Offset(offset)
	}

	err = db.Find(&job_infos).Error
	return job_infos, total, err
}
func (job_infoService *JobService) GetJobPublic() {
	// 此方法为获取数据源定义的数据
	// 请自行实现
}

// GetJobInfoList 分页获取职位记录
// Author [yourname](https://github.com/yourname)
func (job_infoService *JobService) ListJobs(address string) (list []job.Job, total int64, err error) {
	if address == "" {
		return nil, 0, nil
	}

	user := &user.User{Address: &address}
	err = global.GVA_DB.Where("address=?", address).FirstOrCreate(user).Error
	if err != nil {
		log.Errorf("createUserFailed %s")
		return nil, 0, err
	}

	var userCertificates []user_certificate.UserCertificate
	db := global.GVA_DB.Model(&user_certificate.UserCertificate{})
	err = db.Where("user_id=?", user.ID).Find(&userCertificates).Error
	if err != nil {
		return nil, 0, err
	}
	global.GVA_LOG.Info("userCertificates", zap.Any("userCertificates", userCertificates))
	var userCertificateIDs []int
	for _, userCertificate := range userCertificates {
		userCertificateIDs = append(userCertificateIDs, *userCertificate.CertificateId)
	}

	// 创建db
	jobDB := global.GVA_DB.Model(&job.Job{})
	var job_infos []job.Job
	// 如果有条件搜索 下方会自动创建搜索语句
	err = jobDB.Count(&total).Error
	if err != nil {
		return
	}
	log.Infof("total %v", total)

	jobDB = jobDB.Joins("left join job_certificate on job_certificate.job_id = job.id").Where("certificate_id is null or certificate_id in ?", userCertificateIDs)
	err = jobDB.Find(&job_infos).Error
	return job_infos, total, err
}
