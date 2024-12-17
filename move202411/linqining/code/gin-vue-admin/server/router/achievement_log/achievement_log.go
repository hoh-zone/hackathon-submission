package achievement_log

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type AchievementLogRouter struct {}

// InitAchievementLogRouter 初始化 奖励记录 路由信息
func (s *AchievementLogRouter) InitAchievementLogRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	achievementlogRouter := Router.Group("achievementlog").Use(middleware.OperationRecord())
	achievementlogRouterWithoutRecord := Router.Group("achievementlog")
	achievementlogRouterWithoutAuth := PublicRouter.Group("achievementlog")
	{
		achievementlogRouter.POST("createAchievementLog", achievementlogApi.CreateAchievementLog)   // 新建奖励记录
		achievementlogRouter.DELETE("deleteAchievementLog", achievementlogApi.DeleteAchievementLog) // 删除奖励记录
		achievementlogRouter.DELETE("deleteAchievementLogByIds", achievementlogApi.DeleteAchievementLogByIds) // 批量删除奖励记录
		achievementlogRouter.PUT("updateAchievementLog", achievementlogApi.UpdateAchievementLog)    // 更新奖励记录
	}
	{
		achievementlogRouterWithoutRecord.GET("findAchievementLog", achievementlogApi.FindAchievementLog)        // 根据ID获取奖励记录
		achievementlogRouterWithoutRecord.GET("getAchievementLogList", achievementlogApi.GetAchievementLogList)  // 获取奖励记录列表
	}
	{
	    achievementlogRouterWithoutAuth.GET("getAchievementLogPublic", achievementlogApi.GetAchievementLogPublic)  // 奖励记录开放接口
	}
}
