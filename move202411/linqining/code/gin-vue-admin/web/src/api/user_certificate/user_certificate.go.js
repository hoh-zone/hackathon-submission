import service from '@/utils/request'
// @Tags UserCertificate
// @Summary 创建用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.UserCertificate true "创建用户资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /userCertificate/createUserCertificate [post]
export const createUserCertificate = (data) => {
  return service({
    url: '/userCertificate/createUserCertificate',
    method: 'post',
    data
  })
}

// @Tags UserCertificate
// @Summary 删除用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.UserCertificate true "删除用户资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /userCertificate/deleteUserCertificate [delete]
export const deleteUserCertificate = (params) => {
  return service({
    url: '/userCertificate/deleteUserCertificate',
    method: 'delete',
    params
  })
}

// @Tags UserCertificate
// @Summary 批量删除用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除用户资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /userCertificate/deleteUserCertificate [delete]
export const deleteUserCertificateByIds = (params) => {
  return service({
    url: '/userCertificate/deleteUserCertificateByIds',
    method: 'delete',
    params
  })
}

// @Tags UserCertificate
// @Summary 更新用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.UserCertificate true "更新用户资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /userCertificate/updateUserCertificate [put]
export const updateUserCertificate = (data) => {
  return service({
    url: '/userCertificate/updateUserCertificate',
    method: 'put',
    data
  })
}

// @Tags UserCertificate
// @Summary 用id查询用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.UserCertificate true "用id查询用户资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /userCertificate/findUserCertificate [get]
export const findUserCertificate = (params) => {
  return service({
    url: '/userCertificate/findUserCertificate',
    method: 'get',
    params
  })
}

// @Tags UserCertificate
// @Summary 分页获取用户资质列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取用户资质列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /userCertificate/getUserCertificateList [get]
export const getUserCertificateList = (params) => {
  return service({
    url: '/userCertificate/getUserCertificateList',
    method: 'get',
    params
  })
}

// @Tags UserCertificate
// @Summary 不需要鉴权的用户资质接口
// @accept application/json
// @Produce application/json
// @Param data query user_certificateReq.UserCertificateSearch true "分页获取用户资质列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /userCertificate/getUserCertificatePublic [get]
export const getUserCertificatePublic = () => {
  return service({
    url: '/userCertificate/getUserCertificatePublic',
    method: 'get',
  })
}
