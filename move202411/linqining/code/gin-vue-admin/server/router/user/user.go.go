package user

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type UserRouter struct{}

// InitUserRouter 初始化 用户 路由信息
func (s *UserRouter) InitUserRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	user_infoRouter := Router.Group("user_info").Use(middleware.OperationRecord())
	user_infoRouterWithoutRecord := Router.Group("user_info")
	user_infoRouterWithoutAuth := PublicRouter.Group("user_info")
	{
		user_infoRouter.POST("createUser", user_infoApi.CreateUser)             // 新建用户
		user_infoRouter.DELETE("deleteUser", user_infoApi.DeleteUser)           // 删除用户
		user_infoRouter.DELETE("deleteUserByIds", user_infoApi.DeleteUserByIds) // 批量删除用户
		user_infoRouter.PUT("updateUser", user_infoApi.UpdateUser)              // 更新用户
	}
	{
		user_infoRouterWithoutRecord.GET("findUser", user_infoApi.FindUser)       // 根据ID获取用户
		user_infoRouterWithoutRecord.GET("getUserList", user_infoApi.GetUserList) // 获取用户列表
	}
	{
		user_infoRouterWithoutAuth.GET("getUserPublic", user_infoApi.GetUserPublic) // 用户开放接口
	}

	{
		user_infoRouterWithoutAuth.POST("loginByAddress", user_infoApi.LoginByAddress) // 用户开放接口
	}
	{
		user_infoRouterWithoutAuth.POST("getCertificate", user_infoApi.UserGetCertificate) // 用户开放接口
	}
}
