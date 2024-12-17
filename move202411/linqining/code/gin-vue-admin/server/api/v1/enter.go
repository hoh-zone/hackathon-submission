package v1

import (
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/achievement"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/achievement_log"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/certificate"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/company"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/employee"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/example"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/job"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/job_application"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/job_certificate"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/system"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/user"
	"github.com/flipped-aurora/gin-vue-admin/server/api/v1/user_certificate"
)

var ApiGroupApp = new(ApiGroup)

type ApiGroup struct {
	SystemApiGroup           system.ApiGroup
	ExampleApiGroup          example.ApiGroup
	UserApiGroup             user.ApiGroup
	CompanyApiGroup          company.ApiGroup
	JobApiGroup              job.ApiGroup
	CertificateApiGroup      certificate.ApiGroup
	Job_certificateApiGroup  job_certificate.ApiGroup
	User_certificateApiGroup user_certificate.ApiGroup
	EmployeeApiGroup         employee.ApiGroup
	AchievementApiGroup      achievement.ApiGroup
	Achievement_logApiGroup  achievement_log.ApiGroup
	Job_applicationApiGroup  job_application.ApiGroup
}
