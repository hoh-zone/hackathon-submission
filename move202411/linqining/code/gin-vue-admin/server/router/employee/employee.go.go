package employee

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type EmployeeRouter struct{}

func (s *EmployeeRouter) InitEmployeeRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	employeeInfoRouter := Router.Group("employeeInfo").Use(middleware.OperationRecord())
	employeeInfoRouterWithoutRecord := Router.Group("employeeInfo")
	employeeInfoRouterWithoutAuth := PublicRouter.Group("employeeInfo")
	{
		employeeInfoRouter.POST("createEmployee", employeeInfoApi.CreateEmployee)
		employeeInfoRouter.DELETE("deleteEmployee", employeeInfoApi.DeleteEmployee)
		employeeInfoRouter.DELETE("deleteEmployeeByIds", employeeInfoApi.DeleteEmployeeByIds)
		employeeInfoRouter.PUT("updateEmployee", employeeInfoApi.UpdateEmployee)
	}
	{
		employeeInfoRouterWithoutRecord.GET("findEmployee", employeeInfoApi.FindEmployee)
		employeeInfoRouterWithoutRecord.GET("getEmployeeList", employeeInfoApi.GetEmployeeList)
	}
	{
		employeeInfoRouterWithoutAuth.GET("getEmployeePublic", employeeInfoApi.GetEmployeePublic)
		employeeInfoRouterWithoutAuth.POST("updateContractDigest", employeeInfoApi.UpdateContractDigest)
	}
}
