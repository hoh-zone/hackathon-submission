import service from '@/utils/request'
// @Tags Employee
// @Summary 创建员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Employee true "创建员工信息"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /employeeInfo/createEmployee [post]
export const createEmployee = (data) => {
  return service({
    url: '/employeeInfo/createEmployee',
    method: 'post',
    data
  })
}

// @Tags Employee
// @Summary 删除员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Employee true "删除员工信息"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /employeeInfo/deleteEmployee [delete]
export const deleteEmployee = (params) => {
  return service({
    url: '/employeeInfo/deleteEmployee',
    method: 'delete',
    params
  })
}

// @Tags Employee
// @Summary 批量删除员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除员工信息"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /employeeInfo/deleteEmployee [delete]
export const deleteEmployeeByIds = (params) => {
  return service({
    url: '/employeeInfo/deleteEmployeeByIds',
    method: 'delete',
    params
  })
}

// @Tags Employee
// @Summary 更新员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Employee true "更新员工信息"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /employeeInfo/updateEmployee [put]
export const updateEmployee = (data) => {
  return service({
    url: '/employeeInfo/updateEmployee',
    method: 'put',
    data
  })
}

// @Tags Employee
// @Summary 用id查询员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.Employee true "用id查询员工信息"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /employeeInfo/findEmployee [get]
export const findEmployee = (params) => {
  return service({
    url: '/employeeInfo/findEmployee',
    method: 'get',
    params
  })
}

// @Tags Employee
// @Summary 分页获取员工信息列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取员工信息列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /employeeInfo/getEmployeeList [get]
export const getEmployeeList = (params) => {
  return service({
    url: '/employeeInfo/getEmployeeList',
    method: 'get',
    params
  })
}

// @Tags Employee
// @Summary 不需要鉴权的员工信息接口
// @accept application/json
// @Produce application/json
// @Param data query employeeReq.EmployeeSearch true "分页获取员工信息列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /employeeInfo/getEmployeePublic [get]
export const getEmployeePublic = () => {
  return service({
    url: '/employeeInfo/getEmployeePublic',
    method: 'get',
  })
}


export const updateContractDigest = (data) => {
  return service({
    url: '/employeeInfo/updateContractDigest',
    method: 'POST',
    data
  })
}
