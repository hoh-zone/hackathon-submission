import service from '@/utils/request'
// @Tags Certificate
// @Summary 创建资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Certificate true "创建资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"创建成功"}"
// @Router /certificates/createCertificate [post]
export const createCertificate = (data) => {
  return service({
    url: '/certificates/createCertificate',
    method: 'post',
    data
  })
}

// @Tags Certificate
// @Summary 删除资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Certificate true "删除资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /certificates/deleteCertificate [delete]
export const deleteCertificate = (params) => {
  return service({
    url: '/certificates/deleteCertificate',
    method: 'delete',
    params
  })
}

// @Tags Certificate
// @Summary 批量删除资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body request.IdsReq true "批量删除资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"删除成功"}"
// @Router /certificates/deleteCertificate [delete]
export const deleteCertificateByIds = (params) => {
  return service({
    url: '/certificates/deleteCertificateByIds',
    method: 'delete',
    params
  })
}

// @Tags Certificate
// @Summary 更新资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body model.Certificate true "更新资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"更新成功"}"
// @Router /certificates/updateCertificate [put]
export const updateCertificate = (data) => {
  return service({
    url: '/certificates/updateCertificate',
    method: 'put',
    data
  })
}

// @Tags Certificate
// @Summary 用id查询资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query model.Certificate true "用id查询资质"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"查询成功"}"
// @Router /certificates/findCertificate [get]
export const findCertificate = (params) => {
  return service({
    url: '/certificates/findCertificate',
    method: 'get',
    params
  })
}

// @Tags Certificate
// @Summary 分页获取资质列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query request.PageInfo true "分页获取资质列表"
// @Success 200 {string} string "{"success":true,"data":{},"msg":"获取成功"}"
// @Router /certificates/getCertificateList [get]
export const getCertificateList = (params) => {
  return service({
    url: '/certificates/getCertificateList',
    method: 'get',
    params
  })
}

// @Tags Certificate
// @Summary 不需要鉴权的资质接口
// @accept application/json
// @Produce application/json
// @Param data query certificateReq.CertificateSearch true "分页获取资质列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /certificates/getCertificatePublic [get]
export const getCertificatePublic = () => {
  return service({
    url: '/certificates/getCertificatePublic',
    method: 'get',
  })
}
