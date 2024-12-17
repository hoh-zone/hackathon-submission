package employee

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ EmployeeApi }

var employeeInfoService = service.ServiceGroupApp.EmployeeServiceGroup.EmployeeService
