package company

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type CompanyRouter struct{}

func (s *CompanyRouter) InitCompanyRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	company_infoRouter := Router.Group("company_info").Use(middleware.OperationRecord())
	company_infoRouterWithoutRecord := Router.Group("company_info")
	company_infoRouterWithoutAuth := PublicRouter.Group("company_info")
	{
		company_infoRouter.POST("createCompany", company_infoApi.CreateCompany)
		company_infoRouter.DELETE("deleteCompany", company_infoApi.DeleteCompany)
		company_infoRouter.DELETE("deleteCompanyByIds", company_infoApi.DeleteCompanyByIds)
		company_infoRouter.PUT("updateCompany", company_infoApi.UpdateCompany)
	}
	{
		company_infoRouterWithoutRecord.GET("findCompany", company_infoApi.FindCompany)
		company_infoRouterWithoutRecord.GET("getCompanyList", company_infoApi.GetCompanyList)
	}
	{
		company_infoRouterWithoutAuth.GET("getCompanyPublic", company_infoApi.GetCompanyPublic)
		company_infoRouterWithoutAuth.POST("batchGetByAddress", company_infoApi.BatchGetByAddress)
	}
}
