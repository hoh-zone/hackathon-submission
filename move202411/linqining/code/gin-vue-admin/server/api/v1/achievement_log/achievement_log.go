package achievement_log

import (
	
	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/model/achievement_log"
    achievement_logReq "github.com/flipped-aurora/gin-vue-admin/server/model/achievement_log/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

type AchievementLogApi struct {}



// CreateAchievementLog 创建奖励记录
// @Tags AchievementLog
// @Summary 创建奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body achievement_log.AchievementLog true "创建奖励记录"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /achievementlog/createAchievementLog [post]
func (achievementlogApi *AchievementLogApi) CreateAchievementLog(c *gin.Context) {
	var achievementlog achievement_log.AchievementLog
	err := c.ShouldBindJSON(&achievementlog)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = achievementlogService.CreateAchievementLog(&achievementlog)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteAchievementLog 删除奖励记录
// @Tags AchievementLog
// @Summary 删除奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body achievement_log.AchievementLog true "删除奖励记录"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /achievementlog/deleteAchievementLog [delete]
func (achievementlogApi *AchievementLogApi) DeleteAchievementLog(c *gin.Context) {
	ID := c.Query("ID")
	err := achievementlogService.DeleteAchievementLog(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteAchievementLogByIds 批量删除奖励记录
// @Tags AchievementLog
// @Summary 批量删除奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /achievementlog/deleteAchievementLogByIds [delete]
func (achievementlogApi *AchievementLogApi) DeleteAchievementLogByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := achievementlogService.DeleteAchievementLogByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateAchievementLog 更新奖励记录
// @Tags AchievementLog
// @Summary 更新奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body achievement_log.AchievementLog true "更新奖励记录"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /achievementlog/updateAchievementLog [put]
func (achievementlogApi *AchievementLogApi) UpdateAchievementLog(c *gin.Context) {
	var achievementlog achievement_log.AchievementLog
	err := c.ShouldBindJSON(&achievementlog)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = achievementlogService.UpdateAchievementLog(achievementlog)
	if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindAchievementLog 用id查询奖励记录
// @Tags AchievementLog
// @Summary 用id查询奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query achievement_log.AchievementLog true "用id查询奖励记录"
// @Success 200 {object} response.Response{data=achievement_log.AchievementLog,msg=string} "查询成功"
// @Router /achievementlog/findAchievementLog [get]
func (achievementlogApi *AchievementLogApi) FindAchievementLog(c *gin.Context) {
	ID := c.Query("ID")
	reachievementlog, err := achievementlogService.GetAchievementLog(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
	response.OkWithData(reachievementlog, c)
}
// GetAchievementLogList 分页获取奖励记录列表
// @Tags AchievementLog
// @Summary 分页获取奖励记录列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query achievement_logReq.AchievementLogSearch true "分页获取奖励记录列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /achievementlog/getAchievementLogList [get]
func (achievementlogApi *AchievementLogApi) GetAchievementLogList(c *gin.Context) {
	var pageInfo achievement_logReq.AchievementLogSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := achievementlogService.GetAchievementLogInfoList(pageInfo)
	if err != nil {
	    global.GVA_LOG.Error("获取失败!", zap.Error(err))
        response.FailWithMessage("获取失败:" + err.Error(), c)
        return
    }
    response.OkWithDetailed(response.PageResult{
        List:     list,
        Total:    total,
        Page:     pageInfo.Page,
        PageSize: pageInfo.PageSize,
    }, "获取成功", c)
}

// GetAchievementLogPublic 不需要鉴权的奖励记录接口
// @Tags AchievementLog
// @Summary 不需要鉴权的奖励记录接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /achievementlog/getAchievementLogPublic [get]
func (achievementlogApi *AchievementLogApi) GetAchievementLogPublic(c *gin.Context) {
    // 此接口不需要鉴权
    // 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    achievementlogService.GetAchievementLogPublic()
    response.OkWithDetailed(gin.H{
       "info": "不需要鉴权的奖励记录接口信息",
    }, "获取成功", c)
}
