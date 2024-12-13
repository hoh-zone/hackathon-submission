package user_certificate

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ UserCertificateApi }

var userCertificateService = service.ServiceGroupApp.User_certificateServiceGroup.UserCertificateService
