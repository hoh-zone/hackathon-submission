package job_application

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ JobApplicationApi }

var jobApplicationService = service.ServiceGroupApp.Job_applicationServiceGroup.JobApplicationService
