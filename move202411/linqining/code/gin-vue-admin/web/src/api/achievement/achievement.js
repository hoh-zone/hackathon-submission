import service from '@/utils/request'
// @Tags Achievement
// @Summary 创建成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Achievement true "创建成就"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /achievement_info/createAchievement [post]
export const createAchievement = (data) => {
  return service({
    url: '/achievement_info/createAchievement',
    method: 'post',
    data
  })
}

// @Tags Achievement
// @Summary 删除成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Achievement true "删除成就"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /achievement_info/deleteAchievement [delete]
export const deleteAchievement = (params) => {
  return service({
    url: '/achievement_info/deleteAchievement',
    method: 'delete',
    params
  })
}

// @Tags Achievement
// @Summary 批量删除成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除成就"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /achievement_info/deleteAchievement [delete]
export const deleteAchievementByIds = (params) => {
  return service({
    url: '/achievement_info/deleteAchievementByIds',
    method: 'delete',
    params
  })
}

// @Tags Achievement
// @Summary 更新成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Achievement true "更新成就"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /achievement_info/updateAchievement [put]
export const updateAchievement = (data) => {
  return service({
    url: '/achievement_info/updateAchievement',
    method: 'put',
    data
  })
}

// @Tags Achievement
// @Summary 用id查询成就
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.Achievement true "用id查询成就"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /achievement_info/findAchievement [get]
export const findAchievement = (params) => {
  return service({
    url: '/achievement_info/findAchievement',
    method: 'get',
    params
  })
}

// @Tags Achievement
// @Summary 分页获取成就列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取成就列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /achievement_info/getAchievementList [get]
export const getAchievementList = (params) => {
  return service({
    url: '/achievement_info/getAchievementList',
    method: 'get',
    params
  })
}

// @Tags Achievement
// @Summary 不需要鉴权的成就接口
// @accept application/json
// @Produce application/json
// @Param data query achievementReq.AchievementSearch true "分页获取成就列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /achievement_info/getAchievementPublic [get]
export const getAchievementPublic = () => {
  return service({
    url: '/achievement_info/getAchievementPublic',
    method: 'get',
  })
}
