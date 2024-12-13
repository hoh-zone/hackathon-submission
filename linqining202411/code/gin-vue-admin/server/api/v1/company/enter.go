package company

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ CompanyApi }

var company_infoService = service.ServiceGroupApp.CompanyServiceGroup.CompanyService
