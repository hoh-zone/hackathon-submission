package company

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ CompanyRouter }

var company_infoApi = api.ApiGroupApp.CompanyApiGroup.CompanyApi
