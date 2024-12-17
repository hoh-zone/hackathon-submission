package job_application

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ JobApplicationRouter }

var jobApplicationApi = api.ApiGroupApp.Job_applicationApiGroup.JobApplicationApi
