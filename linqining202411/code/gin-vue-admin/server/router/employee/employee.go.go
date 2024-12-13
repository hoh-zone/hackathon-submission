package employee

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type EmployeeRouter struct {}

// InitEmployeeRouter 初始化 员工信息 路由信息
func (s *EmployeeRouter) InitEmployeeRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	employeeInfoRouter := Router.Group("employeeInfo").Use(middleware.OperationRecord())
	employeeInfoRouterWithoutRecord := Router.Group("employeeInfo")
	employeeInfoRouterWithoutAuth := PublicRouter.Group("employeeInfo")
	{
		employeeInfoRouter.POST("createEmployee", employeeInfoApi.CreateEmployee)   // 新建员工信息
		employeeInfoRouter.DELETE("deleteEmployee", employeeInfoApi.DeleteEmployee) // 删除员工信息
		employeeInfoRouter.DELETE("deleteEmployeeByIds", employeeInfoApi.DeleteEmployeeByIds) // 批量删除员工信息
		employeeInfoRouter.PUT("updateEmployee", employeeInfoApi.UpdateEmployee)    // 更新员工信息
	}
	{
		employeeInfoRouterWithoutRecord.GET("findEmployee", employeeInfoApi.FindEmployee)        // 根据ID获取员工信息
		employeeInfoRouterWithoutRecord.GET("getEmployeeList", employeeInfoApi.GetEmployeeList)  // 获取员工信息列表
	}
	{
	    employeeInfoRouterWithoutAuth.GET("getEmployeePublic", employeeInfoApi.GetEmployeePublic)  // 员工信息开放接口
	}
}
