import service from '@/utils/request'
// @Tags AchievementLog
// @Summary 创建奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.AchievementLog true "创建奖励记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /achievementlog/createAchievementLog [post]
export const createAchievementLog = (data) => {
  return service({
    url: '/achievementlog/createAchievementLog',
    method: 'post',
    data
  })
}

// @Tags AchievementLog
// @Summary 删除奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.AchievementLog true "删除奖励记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /achievementlog/deleteAchievementLog [delete]
export const deleteAchievementLog = (params) => {
  return service({
    url: '/achievementlog/deleteAchievementLog',
    method: 'delete',
    params
  })
}

// @Tags AchievementLog
// @Summary 批量删除奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除奖励记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /achievementlog/deleteAchievementLog [delete]
export const deleteAchievementLogByIds = (params) => {
  return service({
    url: '/achievementlog/deleteAchievementLogByIds',
    method: 'delete',
    params
  })
}

// @Tags AchievementLog
// @Summary 更新奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.AchievementLog true "更新奖励记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /achievementlog/updateAchievementLog [put]
export const updateAchievementLog = (data) => {
  return service({
    url: '/achievementlog/updateAchievementLog',
    method: 'put',
    data
  })
}

// @Tags AchievementLog
// @Summary 用id查询奖励记录
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.AchievementLog true "用id查询奖励记录"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /achievementlog/findAchievementLog [get]
export const findAchievementLog = (params) => {
  return service({
    url: '/achievementlog/findAchievementLog',
    method: 'get',
    params
  })
}

// @Tags AchievementLog
// @Summary 分页获取奖励记录列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取奖励记录列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /achievementlog/getAchievementLogList [get]
export const getAchievementLogList = (params) => {
  return service({
    url: '/achievementlog/getAchievementLogList',
    method: 'get',
    params
  })
}

// @Tags AchievementLog
// @Summary 不需要鉴权的奖励记录接口
// @accept application/json
// @Produce application/json
// @Param data query achievement_logReq.AchievementLogSearch true "分页获取奖励记录列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /achievementlog/getAchievementLogPublic [get]
export const getAchievementLogPublic = () => {
  return service({
    url: '/achievementlog/getAchievementLogPublic',
    method: 'get',
  })
}
