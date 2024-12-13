package employee

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ EmployeeRouter }

var employeeInfoApi = api.ApiGroupApp.EmployeeApiGroup.EmployeeApi
