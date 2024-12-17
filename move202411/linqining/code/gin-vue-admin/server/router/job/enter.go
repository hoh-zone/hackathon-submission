package job

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ JobRouter }

var job_infoApi = api.ApiGroupApp.JobApiGroup.JobApi
