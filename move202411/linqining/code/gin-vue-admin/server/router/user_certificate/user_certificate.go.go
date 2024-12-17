package user_certificate

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type UserCertificateRouter struct {}

// InitUserCertificateRouter 初始化 用户资质 路由信息
func (s *UserCertificateRouter) InitUserCertificateRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	userCertificateRouter := Router.Group("userCertificate").Use(middleware.OperationRecord())
	userCertificateRouterWithoutRecord := Router.Group("userCertificate")
	userCertificateRouterWithoutAuth := PublicRouter.Group("userCertificate")
	{
		userCertificateRouter.POST("createUserCertificate", userCertificateApi.CreateUserCertificate)   // 新建用户资质
		userCertificateRouter.DELETE("deleteUserCertificate", userCertificateApi.DeleteUserCertificate) // 删除用户资质
		userCertificateRouter.DELETE("deleteUserCertificateByIds", userCertificateApi.DeleteUserCertificateByIds) // 批量删除用户资质
		userCertificateRouter.PUT("updateUserCertificate", userCertificateApi.UpdateUserCertificate)    // 更新用户资质
	}
	{
		userCertificateRouterWithoutRecord.GET("findUserCertificate", userCertificateApi.FindUserCertificate)        // 根据ID获取用户资质
		userCertificateRouterWithoutRecord.GET("getUserCertificateList", userCertificateApi.GetUserCertificateList)  // 获取用户资质列表
	}
	{
	    userCertificateRouterWithoutAuth.GET("getUserCertificatePublic", userCertificateApi.GetUserCertificatePublic)  // 用户资质开放接口
	}
}
