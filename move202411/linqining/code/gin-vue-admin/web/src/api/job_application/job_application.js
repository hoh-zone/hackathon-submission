import service from '@/utils/request'
// @Tags JobApplication
// @Summary 创建职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.JobApplication true "创建职位申请"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /jobApplication/createJobApplication [post]
export const createJobApplication = (data) => {
  return service({
    url: '/jobApplication/createJobApplication',
    method: 'post',
    data
  })
}

// @Tags JobApplication
// @Summary 删除职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.JobApplication true "删除职位申请"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /jobApplication/deleteJobApplication [delete]
export const deleteJobApplication = (params) => {
  return service({
    url: '/jobApplication/deleteJobApplication',
    method: 'delete',
    params
  })
}

// @Tags JobApplication
// @Summary 批量删除职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除职位申请"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /jobApplication/deleteJobApplication [delete]
export const deleteJobApplicationByIds = (params) => {
  return service({
    url: '/jobApplication/deleteJobApplicationByIds',
    method: 'delete',
    params
  })
}

// @Tags JobApplication
// @Summary 更新职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.JobApplication true "更新职位申请"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /jobApplication/updateJobApplication [put]
export const updateJobApplication = (data) => {
  return service({
    url: '/jobApplication/updateJobApplication',
    method: 'put',
    data
  })
}

// @Tags JobApplication
// @Summary 用id查询职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.JobApplication true "用id查询职位申请"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /jobApplication/findJobApplication [get]
export const findJobApplication = (params) => {
  return service({
    url: '/jobApplication/findJobApplication',
    method: 'get',
    params
  })
}

// @Tags JobApplication
// @Summary 分页获取职位申请列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取职位申请列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /jobApplication/getJobApplicationList [get]
export const getJobApplicationList = (params) => {
  return service({
    url: '/jobApplication/getJobApplicationList',
    method: 'get',
    params
  })
}

// @Tags JobApplication
// @Summary 不需要鉴权的职位申请接口
// @accept application/json
// @Produce application/json
// @Param data query job_applicationReq.JobApplicationSearch true "分页获取职位申请列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /jobApplication/getJobApplicationPublic [get]
export const getJobApplicationPublic = () => {
  return service({
    url: '/jobApplication/getJobApplicationPublic',
    method: 'get',
  })
}
// UserApply 申请职位
// @Tags JobApplication
// @Summary 申请职位
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /jobApplication/userApply [POST]
export const userApply = () => {
  return service({
    url: '/jobApplication/userApply',
    method: 'POST'
  })
}
// UpdateDigest Offer交易摘要回填
// @Tags JobApplication
// @Summary Offer交易摘要回填
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /jobApplication/updateDigest [POST]
export const updateDigest = (data) => {
  return service({
    url: '/jobApplication/updateDigest',
    method: 'POST',
    data
  })
}
