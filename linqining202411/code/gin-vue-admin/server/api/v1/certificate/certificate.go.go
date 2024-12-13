package certificate

import (
	
	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/model/certificate"
    certificateReq "github.com/flipped-aurora/gin-vue-admin/server/model/certificate/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

type CertificateApi struct {}



// CreateCertificate 创建资质
// @Tags Certificate
// @Summary 创建资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body certificate.Certificate true "创建资质"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /certificates/createCertificate [post]
func (certificatesApi *CertificateApi) CreateCertificate(c *gin.Context) {
	var certificates certificate.Certificate
	err := c.ShouldBindJSON(&certificates)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = certificatesService.CreateCertificate(&certificates)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteCertificate 删除资质
// @Tags Certificate
// @Summary 删除资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body certificate.Certificate true "删除资质"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /certificates/deleteCertificate [delete]
func (certificatesApi *CertificateApi) DeleteCertificate(c *gin.Context) {
	ID := c.Query("ID")
	err := certificatesService.DeleteCertificate(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteCertificateByIds 批量删除资质
// @Tags Certificate
// @Summary 批量删除资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /certificates/deleteCertificateByIds [delete]
func (certificatesApi *CertificateApi) DeleteCertificateByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := certificatesService.DeleteCertificateByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateCertificate 更新资质
// @Tags Certificate
// @Summary 更新资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body certificate.Certificate true "更新资质"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /certificates/updateCertificate [put]
func (certificatesApi *CertificateApi) UpdateCertificate(c *gin.Context) {
	var certificates certificate.Certificate
	err := c.ShouldBindJSON(&certificates)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = certificatesService.UpdateCertificate(certificates)
	if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindCertificate 用id查询资质
// @Tags Certificate
// @Summary 用id查询资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query certificate.Certificate true "用id查询资质"
// @Success 200 {object} response.Response{data=certificate.Certificate,msg=string} "查询成功"
// @Router /certificates/findCertificate [get]
func (certificatesApi *CertificateApi) FindCertificate(c *gin.Context) {
	ID := c.Query("ID")
	recertificates, err := certificatesService.GetCertificate(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
	response.OkWithData(recertificates, c)
}
// GetCertificateList 分页获取资质列表
// @Tags Certificate
// @Summary 分页获取资质列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query certificateReq.CertificateSearch true "分页获取资质列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /certificates/getCertificateList [get]
func (certificatesApi *CertificateApi) GetCertificateList(c *gin.Context) {
	var pageInfo certificateReq.CertificateSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := certificatesService.GetCertificateInfoList(pageInfo)
	if err != nil {
	    global.GVA_LOG.Error("获取失败!", zap.Error(err))
        response.FailWithMessage("获取失败:" + err.Error(), c)
        return
    }
    response.OkWithDetailed(response.PageResult{
        List:     list,
        Total:    total,
        Page:     pageInfo.Page,
        PageSize: pageInfo.PageSize,
    }, "获取成功", c)
}

// GetCertificatePublic 不需要鉴权的资质接口
// @Tags Certificate
// @Summary 不需要鉴权的资质接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /certificates/getCertificatePublic [get]
func (certificatesApi *CertificateApi) GetCertificatePublic(c *gin.Context) {
    // 此接口不需要鉴权
    // 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    certificatesService.GetCertificatePublic()
    response.OkWithDetailed(gin.H{
       "info": "不需要鉴权的资质接口信息",
    }, "获取成功", c)
}
