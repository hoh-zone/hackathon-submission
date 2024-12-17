package company

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/model/company"
	companyReq "github.com/flipped-aurora/gin-vue-admin/server/model/company/request"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type CompanyApi struct{}

// CreateCompany 创建公司
// @Tags Company
// @Summary 创建公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body company.Company true "创建公司"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /company_info/createCompany [post]
func (company_infoApi *CompanyApi) CreateCompany(c *gin.Context) {
	var company_info company.Company
	err := c.ShouldBindJSON(&company_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = company_infoService.CreateCompany(&company_info)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteCompany 删除公司
// @Tags Company
// @Summary 删除公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body company.Company true "删除公司"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /company_info/deleteCompany [delete]
func (company_infoApi *CompanyApi) DeleteCompany(c *gin.Context) {
	ID := c.Query("ID")
	err := company_infoService.DeleteCompany(ID)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteCompanyByIds 批量删除公司
// @Tags Company
// @Summary 批量删除公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /company_info/deleteCompanyByIds [delete]
func (company_infoApi *CompanyApi) DeleteCompanyByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := company_infoService.DeleteCompanyByIds(IDs)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateCompany 更新公司
// @Tags Company
// @Summary 更新公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body company.Company true "更新公司"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /company_info/updateCompany [put]
func (company_infoApi *CompanyApi) UpdateCompany(c *gin.Context) {
	var company_info company.Company
	err := c.ShouldBindJSON(&company_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = company_infoService.UpdateCompany(company_info)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindCompany 用id查询公司
// @Tags Company
// @Summary 用id查询公司
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query company.Company true "用id查询公司"
// @Success 200 {object} response.Response{data=company.Company,msg=string} "查询成功"
// @Router /company_info/findCompany [get]
func (company_infoApi *CompanyApi) FindCompany(c *gin.Context) {
	ID := c.Query("ID")
	recompany_info, err := company_infoService.GetCompany(ID)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(recompany_info, c)
}

// GetCompanyList 分页获取公司列表
// @Tags Company
// @Summary 分页获取公司列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query companyReq.CompanySearch true "分页获取公司列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /company_info/getCompanyList [get]
func (company_infoApi *CompanyApi) GetCompanyList(c *gin.Context) {
	var pageInfo companyReq.CompanySearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := company_infoService.GetCompanyInfoList(pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败:"+err.Error(), c)
		return
	}
	response.OkWithDetailed(response.PageResult{
		List:     list,
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}

// GetCompanyPublic 不需要鉴权的公司接口
// @Tags Company
// @Summary 不需要鉴权的公司接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /company_info/getCompanyPublic [get]
func (company_infoApi *CompanyApi) GetCompanyPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	company_infoService.GetCompanyPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的公司接口信息",
	}, "获取成功", c)
}

// BatchGetByAddress 批量获取公司信息
// @Tags Company
// @Summary 批量获取公司信息
// @accept application/json
// @Produce application/json
// @Param data query companyReq.CompanySearch true "成功"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /company_info/batchGetByAddress [POST]
func (company_infoApi *CompanyApi) BatchGetByAddress(c *gin.Context) {
	type BatchGetByAddressReq struct {
		Addresses []string `json:"addresses" form:"addresses"` //申请人钱包地址
	}
	req := BatchGetByAddressReq{}
	err := c.ShouldBindQuery(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	// 请添加自己的业务逻辑
	companyList, err := company_infoService.BatchGetByAddress(req.Addresses)
	if err != nil {
		global.GVA_LOG.Error("失败!", zap.Error(err))
		response.FailWithMessage("失败", c)
		return
	}
	response.OkWithDetailed(response.PageResult{
		List: companyList,
	}, "获取成功", c)
}
