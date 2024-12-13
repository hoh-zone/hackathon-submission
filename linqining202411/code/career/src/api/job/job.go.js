import service from '@/utils/request'
// @Tags Job
// @Summary 创建职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Job true "创建职位"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /job_info/createJob [post]
export const createJob = (data) => {
  return service({
    url: '/job_info/createJob',
    method: 'post',
    data
  })
}

// @Tags Job
// @Summary 删除职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Job true "删除职位"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /job_info/deleteJob [delete]
export const deleteJob = (params) => {
  return service({
    url: '/job_info/deleteJob',
    method: 'delete',
    params
  })
}

// @Tags Job
// @Summary 批量删除职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除职位"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /job_info/deleteJob [delete]
export const deleteJobByIds = (params) => {
  return service({
    url: '/job_info/deleteJobByIds',
    method: 'delete',
    params
  })
}

// @Tags Job
// @Summary 更新职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Job true "更新职位"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /job_info/updateJob [put]
export const updateJob = (data) => {
  return service({
    url: '/job_info/updateJob',
    method: 'put',
    data
  })
}

// @Tags Job
// @Summary 用id查询职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.Job true "用id查询职位"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /job_info/findJob [get]
export const findJob = (params) => {
  return service({
    url: '/job_info/findJob',
    method: 'get',
    params
  })
}

// @Tags Job
// @Summary 分页获取职位列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取职位列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /job_info/getJobList [get]
export const getJobList = (params) => {
  return service({
    url: '/job_info/getJobList',
    method: 'get',
    params
  })
}

// @Tags Job
// @Summary 不需要鉴权的职位接口
// @accept application/json
// @Produce application/json
// @Param data query jobReq.JobSearch true "分页获取职位列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /job_info/getJobPublic [get]
export const getJobPublic = () => {
  return service({
    url: '/job_info/getJobPublic',
    method: 'get',
  })
}


// @Tags Job
// @Summary 不需要鉴权的职位接口
// @accept application/json
// @Produce application/json
// @Param data query jobReq.JobSearch true "分页获取职位列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /job_info/ListJobs [post]
export const ListJobs = (data) => {
  return service({
    url: '/job_info/ListJobs',
    method: 'post',
    data:data,
  })
}
