import service from '@/utils/request'
// @Tags JobCertificate
// @Summary 创建职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.JobCertificate true "创建职位资格要求"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /jobCertificate/createJobCertificate [post]
export const createJobCertificate = (data) => {
  return service({
    url: '/jobCertificate/createJobCertificate',
    method: 'post',
    data
  })
}

// @Tags JobCertificate
// @Summary 删除职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.JobCertificate true "删除职位资格要求"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /jobCertificate/deleteJobCertificate [delete]
export const deleteJobCertificate = (params) => {
  return service({
    url: '/jobCertificate/deleteJobCertificate',
    method: 'delete',
    params
  })
}

// @Tags JobCertificate
// @Summary 批量删除职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除职位资格要求"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /jobCertificate/deleteJobCertificate [delete]
export const deleteJobCertificateByIds = (params) => {
  return service({
    url: '/jobCertificate/deleteJobCertificateByIds',
    method: 'delete',
    params
  })
}

// @Tags JobCertificate
// @Summary 更新职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.JobCertificate true "更新职位资格要求"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /jobCertificate/updateJobCertificate [put]
export const updateJobCertificate = (data) => {
  return service({
    url: '/jobCertificate/updateJobCertificate',
    method: 'put',
    data
  })
}

// @Tags JobCertificate
// @Summary 用id查询职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.JobCertificate true "用id查询职位资格要求"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /jobCertificate/findJobCertificate [get]
export const findJobCertificate = (params) => {
  return service({
    url: '/jobCertificate/findJobCertificate',
    method: 'get',
    params
  })
}

// @Tags JobCertificate
// @Summary 分页获取职位资格要求列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取职位资格要求列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /jobCertificate/getJobCertificateList [get]
export const getJobCertificateList = (params) => {
  return service({
    url: '/jobCertificate/getJobCertificateList',
    method: 'get',
    params
  })
}

// @Tags JobCertificate
// @Summary 不需要鉴权的职位资格要求接口
// @accept application/json
// @Produce application/json
// @Param data query job_certificateReq.JobCertificateSearch true "分页获取职位资格要求列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /jobCertificate/getJobCertificatePublic [get]
export const getJobCertificatePublic = () => {
  return service({
    url: '/jobCertificate/getJobCertificatePublic',
    method: 'get',
  })
}
