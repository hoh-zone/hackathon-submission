import service from '@/utils/request'
// @Tags Company
// @Summary 创建公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Company true "创建公司"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /company_info/createCompany [post]
export const createCompany = (data) => {
  return service({
    url: '/company_info/createCompany',
    method: 'post',
    data
  })
}

// @Tags Company
// @Summary 删除公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Company true "删除公司"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /company_info/deleteCompany [delete]
export const deleteCompany = (params) => {
  return service({
    url: '/company_info/deleteCompany',
    method: 'delete',
    params
  })
}

// @Tags Company
// @Summary 批量删除公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除公司"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /company_info/deleteCompany [delete]
export const deleteCompanyByIds = (params) => {
  return service({
    url: '/company_info/deleteCompanyByIds',
    method: 'delete',
    params
  })
}

// @Tags Company
// @Summary 更新公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Company true "更新公司"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /company_info/updateCompany [put]
export const updateCompany = (data) => {
  return service({
    url: '/company_info/updateCompany',
    method: 'put',
    data
  })
}

// @Tags Company
// @Summary 用id查询公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.Company true "用id查询公司"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /company_info/findCompany [get]
export const findCompany = (params) => {
  return service({
    url: '/company_info/findCompany',
    method: 'get',
    params
  })
}

// @Tags Company
// @Summary 分页获取公司列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取公司列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /company_info/getCompanyList [get]
export const getCompanyList = (params) => {
  return service({
    url: '/company_info/getCompanyList',
    method: 'get',
    params
  })
}

// @Tags Company
// @Summary 不需要鉴权的公司接口
// @accept application/json
// @Produce application/json
// @Param data query companyReq.CompanySearch true "分页获取公司列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /company_info/getCompanyPublic [get]
export const getCompanyPublic = () => {
  return service({
    url: '/company_info/getCompanyPublic',
    method: 'get',
  })
}
