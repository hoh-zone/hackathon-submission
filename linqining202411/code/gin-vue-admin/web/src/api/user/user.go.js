import service from '@/utils/request'
// @Tags User
// @Summary 创建用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.User true "创建用户"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /user_info/createUser [post]
export const createUser = (data) => {
  return service({
    url: '/user_info/createUser',
    method: 'post',
    data
  })
}

// @Tags User
// @Summary 删除用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.User true "删除用户"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /user_info/deleteUser [delete]
export const deleteUser = (params) => {
  return service({
    url: '/user_info/deleteUser',
    method: 'delete',
    params
  })
}

// @Tags User
// @Summary 批量删除用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除用户"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /user_info/deleteUser [delete]
export const deleteUserByIds = (params) => {
  return service({
    url: '/user_info/deleteUserByIds',
    method: 'delete',
    params
  })
}

// @Tags User
// @Summary 更新用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.User true "更新用户"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /user_info/updateUser [put]
export const updateUser = (data) => {
  return service({
    url: '/user_info/updateUser',
    method: 'put',
    data
  })
}

// @Tags User
// @Summary 用id查询用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.User true "用id查询用户"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /user_info/findUser [get]
export const findUser = (params) => {
  return service({
    url: '/user_info/findUser',
    method: 'get',
    params
  })
}

// @Tags User
// @Summary 分页获取用户列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取用户列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /user_info/getUserList [get]
export const getUserList = (params) => {
  return service({
    url: '/user_info/getUserList',
    method: 'get',
    params
  })
}

// @Tags User
// @Summary 不需要鉴权的用户接口
// @accept application/json
// @Produce application/json
// @Param data query userReq.UserSearch true "分页获取用户列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /user_info/getUserPublic [get]
export const getUserPublic = () => {
  return service({
    url: '/user_info/getUserPublic',
    method: 'get',
  })
}

// @Summary 用户登录
// @Produce  application/json
// @Param data body {address:"string"}
// @Router /user_info/getCertificate [post]
export const getCertificate = (data) => {
  return service({
    url: '/user_info/getCertificate',
    method: 'post',
    data: data
  })
}
