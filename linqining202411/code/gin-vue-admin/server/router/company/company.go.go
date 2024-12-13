package company

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type CompanyRouter struct {}

// InitCompanyRouter 初始化 公司 路由信息
func (s *CompanyRouter) InitCompanyRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	company_infoRouter := Router.Group("company_info").Use(middleware.OperationRecord())
	company_infoRouterWithoutRecord := Router.Group("company_info")
	company_infoRouterWithoutAuth := PublicRouter.Group("company_info")
	{
		company_infoRouter.POST("createCompany", company_infoApi.CreateCompany)   // 新建公司
		company_infoRouter.DELETE("deleteCompany", company_infoApi.DeleteCompany) // 删除公司
		company_infoRouter.DELETE("deleteCompanyByIds", company_infoApi.DeleteCompanyByIds) // 批量删除公司
		company_infoRouter.PUT("updateCompany", company_infoApi.UpdateCompany)    // 更新公司
	}
	{
		company_infoRouterWithoutRecord.GET("findCompany", company_infoApi.FindCompany)        // 根据ID获取公司
		company_infoRouterWithoutRecord.GET("getCompanyList", company_infoApi.GetCompanyList)  // 获取公司列表
	}
	{
	    company_infoRouterWithoutAuth.GET("getCompanyPublic", company_infoApi.GetCompanyPublic)  // 公司开放接口
	}
}
