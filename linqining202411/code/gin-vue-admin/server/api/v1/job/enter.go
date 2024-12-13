package job

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ JobApi }

var job_infoService = service.ServiceGroupApp.JobServiceGroup.JobService
