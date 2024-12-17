package certificate

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ CertificateApi }

var certificatesService = service.ServiceGroupApp.CertificateServiceGroup.CertificateService
