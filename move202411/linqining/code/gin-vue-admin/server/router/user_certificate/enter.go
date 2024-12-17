package user_certificate

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ UserCertificateRouter }

var userCertificateApi = api.ApiGroupApp.User_certificateApiGroup.UserCertificateApi
