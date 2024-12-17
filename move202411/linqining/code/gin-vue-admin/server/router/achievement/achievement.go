package achievement

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type AchievementRouter struct {}

// InitAchievementRouter 初始化 成就 路由信息
func (s *AchievementRouter) InitAchievementRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	achievement_infoRouter := Router.Group("achievement_info").Use(middleware.OperationRecord())
	achievement_infoRouterWithoutRecord := Router.Group("achievement_info")
	achievement_infoRouterWithoutAuth := PublicRouter.Group("achievement_info")
	{
		achievement_infoRouter.POST("createAchievement", achievement_infoApi.CreateAchievement)   // 新建成就
		achievement_infoRouter.DELETE("deleteAchievement", achievement_infoApi.DeleteAchievement) // 删除成就
		achievement_infoRouter.DELETE("deleteAchievementByIds", achievement_infoApi.DeleteAchievementByIds) // 批量删除成就
		achievement_infoRouter.PUT("updateAchievement", achievement_infoApi.UpdateAchievement)    // 更新成就
	}
	{
		achievement_infoRouterWithoutRecord.GET("findAchievement", achievement_infoApi.FindAchievement)        // 根据ID获取成就
		achievement_infoRouterWithoutRecord.GET("getAchievementList", achievement_infoApi.GetAchievementList)  // 获取成就列表
	}
	{
	    achievement_infoRouterWithoutAuth.GET("getAchievementPublic", achievement_infoApi.GetAchievementPublic)  // 成就开放接口
	}
}
