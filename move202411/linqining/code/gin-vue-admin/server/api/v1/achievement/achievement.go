package achievement

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/achievement"
	achievementReq "github.com/flipped-aurora/gin-vue-admin/server/model/achievement/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type AchievementApi struct{}

// CreateAchievement 创建成就
// @Tags Achievement
// @Summary 创建成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body achievement.Achievement true "创建成就"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /achievement_info/createAchievement [post]
func (achievement_infoApi *AchievementApi) CreateAchievement(c *gin.Context) {
	var achievement_info achievement.Achievement
	err := c.ShouldBindJSON(&achievement_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = achievement_infoService.CreateAchievement(&achievement_info)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteAchievement 删除成就
// @Tags Achievement
// @Summary 删除成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body achievement.Achievement true "删除成就"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /achievement_info/deleteAchievement [delete]
func (achievement_infoApi *AchievementApi) DeleteAchievement(c *gin.Context) {
	ID := c.Query("ID")
	err := achievement_infoService.DeleteAchievement(ID)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteAchievementByIds 批量删除成就
// @Tags Achievement
// @Summary 批量删除成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /achievement_info/deleteAchievementByIds [delete]
func (achievement_infoApi *AchievementApi) DeleteAchievementByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := achievement_infoService.DeleteAchievementByIds(IDs)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateAchievement 更新成就
// @Tags Achievement
// @Summary 更新成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body achievement.Achievement true "更新成就"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /achievement_info/updateAchievement [put]
func (achievement_infoApi *AchievementApi) UpdateAchievement(c *gin.Context) {
	var achievement_info achievement.Achievement
	err := c.ShouldBindJSON(&achievement_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = achievement_infoService.UpdateAchievement(achievement_info)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindAchievement 用id查询成就
// @Tags Achievement
// @Summary 用id查询成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query achievement.Achievement true "用id查询成就"
// @Success 200 {object} response.Response{data=achievement.Achievement,msg=string} "查询成功"
// @Router /achievement_info/findAchievement [get]
func (achievement_infoApi *AchievementApi) FindAchievement(c *gin.Context) {
	ID := c.Query("ID")
	reachievement_info, err := achievement_infoService.GetAchievement(ID)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(reachievement_info, c)
}

// GetAchievementList 分页获取成就列表
// @Tags Achievement
// @Summary 分页获取成就列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query achievementReq.AchievementSearch true "分页获取成就列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /achievement_info/getAchievementList [get]
func (achievement_infoApi *AchievementApi) GetAchievementList(c *gin.Context) {
	var pageInfo achievementReq.AchievementSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := achievement_infoService.GetAchievementInfoList(pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败:"+err.Error(), c)
		return
	}
	response.OkWithDetailed(response.PageResult{
		List:     list,
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}

// GetAchievementPublic 不需要鉴权的成就接口
// @Tags Achievement
// @Summary 不需要鉴权的成就接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /achievement_info/getAchievementPublic [get]
func (achievement_infoApi *AchievementApi) GetAchievementPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	achievement_infoService.GetAchievementPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的成就接口信息",
	}, "获取成功", c)
}
