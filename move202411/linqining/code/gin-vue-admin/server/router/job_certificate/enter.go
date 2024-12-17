package job_certificate

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ JobCertificateRouter }

var jobCertificateApi = api.ApiGroupApp.Job_certificateApiGroup.JobCertificateApi
