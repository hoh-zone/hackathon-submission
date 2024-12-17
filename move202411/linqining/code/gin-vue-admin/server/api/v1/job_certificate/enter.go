package job_certificate

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ JobCertificateApi }

var jobCertificateService = service.ServiceGroupApp.Job_certificateServiceGroup.JobCertificateService
