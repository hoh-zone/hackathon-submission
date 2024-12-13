package certificate

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ CertificateRouter }

var certificatesApi = api.ApiGroupApp.CertificateApiGroup.CertificateApi
