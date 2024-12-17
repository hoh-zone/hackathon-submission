package certificate

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type CertificateRouter struct {}

// InitCertificateRouter 初始化 资质 路由信息
func (s *CertificateRouter) InitCertificateRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	certificatesRouter := Router.Group("certificates").Use(middleware.OperationRecord())
	certificatesRouterWithoutRecord := Router.Group("certificates")
	certificatesRouterWithoutAuth := PublicRouter.Group("certificates")
	{
		certificatesRouter.POST("createCertificate", certificatesApi.CreateCertificate)   // 新建资质
		certificatesRouter.DELETE("deleteCertificate", certificatesApi.DeleteCertificate) // 删除资质
		certificatesRouter.DELETE("deleteCertificateByIds", certificatesApi.DeleteCertificateByIds) // 批量删除资质
		certificatesRouter.PUT("updateCertificate", certificatesApi.UpdateCertificate)    // 更新资质
	}
	{
		certificatesRouterWithoutRecord.GET("findCertificate", certificatesApi.FindCertificate)        // 根据ID获取资质
		certificatesRouterWithoutRecord.GET("getCertificateList", certificatesApi.GetCertificateList)  // 获取资质列表
	}
	{
	    certificatesRouterWithoutAuth.GET("getCertificatePublic", certificatesApi.GetCertificatePublic)  // 资质开放接口
	}
}
