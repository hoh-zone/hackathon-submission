package initialize

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/certificate"
	"github.com/flipped-aurora/gin-vue-admin/server/model/company"
	"github.com/flipped-aurora/gin-vue-admin/server/model/employee"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job_certificate"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate"
)

func bizModel() error {
	db := global.GVA_DB
	err := db.AutoMigrate(company.Company{}, user.User{}, job.Job{}, certificate.Certificate{}, job_certificate.JobCertificate{}, user_certificate.UserCertificate{}, employee.Employee{})
	if err != nil {
		return err
	}
	return nil
}
