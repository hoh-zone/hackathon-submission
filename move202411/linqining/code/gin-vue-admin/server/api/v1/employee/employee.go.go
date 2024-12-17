package employee

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/model/employee"
	employeeReq "github.com/flipped-aurora/gin-vue-admin/server/model/employee/request"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type EmployeeApi struct{}

// CreateEmployee 创建员工信息
// @Tags Employee
// @Summary 创建员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body employee.Employee true "创建员工信息"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /employeeInfo/createEmployee [post]
func (employeeInfoApi *EmployeeApi) CreateEmployee(c *gin.Context) {
	var employeeInfo employee.Employee
	err := c.ShouldBindJSON(&employeeInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = employeeInfoService.CreateEmployee(&employeeInfo)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteEmployee 删除员工信息
// @Tags Employee
// @Summary 删除员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body employee.Employee true "删除员工信息"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /employeeInfo/deleteEmployee [delete]
func (employeeInfoApi *EmployeeApi) DeleteEmployee(c *gin.Context) {
	ID := c.Query("ID")
	err := employeeInfoService.DeleteEmployee(ID)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteEmployeeByIds 批量删除员工信息
// @Tags Employee
// @Summary 批量删除员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /employeeInfo/deleteEmployeeByIds [delete]
func (employeeInfoApi *EmployeeApi) DeleteEmployeeByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := employeeInfoService.DeleteEmployeeByIds(IDs)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateEmployee 更新员工信息
// @Tags Employee
// @Summary 更新员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body employee.Employee true "更新员工信息"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /employeeInfo/updateEmployee [put]
func (employeeInfoApi *EmployeeApi) UpdateEmployee(c *gin.Context) {
	var employeeInfo employee.Employee
	err := c.ShouldBindJSON(&employeeInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = employeeInfoService.UpdateEmployee(employeeInfo)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindEmployee 用id查询员工信息
// @Tags Employee
// @Summary 用id查询员工信息
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query employee.Employee true "用id查询员工信息"
// @Success 200 {object} response.Response{data=employee.Employee,msg=string} "查询成功"
// @Router /employeeInfo/findEmployee [get]
func (employeeInfoApi *EmployeeApi) FindEmployee(c *gin.Context) {
	ID := c.Query("ID")
	reemployeeInfo, err := employeeInfoService.GetEmployee(ID)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(reemployeeInfo, c)
}

// GetEmployeeList 分页获取员工信息列表
// @Tags Employee
// @Summary 分页获取员工信息列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query employeeReq.EmployeeSearch true "分页获取员工信息列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /employeeInfo/getEmployeeList [get]
func (employeeInfoApi *EmployeeApi) GetEmployeeList(c *gin.Context) {
	var pageInfo employeeReq.EmployeeSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := employeeInfoService.GetEmployeeInfoList(pageInfo)
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

// GetEmployeePublic 不需要鉴权的员工信息接口
// @Tags Employee
// @Summary 不需要鉴权的员工信息接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /employeeInfo/getEmployeePublic [get]
func (employeeInfoApi *EmployeeApi) GetEmployeePublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	employeeInfoService.GetEmployeePublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的员工信息接口信息",
	}, "获取成功", c)
}

// UpdateContractDigest 回填合同交易摘要
// @Tags Employee
// @Summary 回填合同交易摘要
// @accept application/json
// @Produce application/json
// @Param data query employeeReq.EmployeeSearch true "成功"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /employeeInfo/updateContractDigest [POST]
func (employeeInfoApi *EmployeeApi) UpdateContractDigest(c *gin.Context) {
	type UpdateContractDigestReq struct {
		PublishAddress  *string `json:"publishAddress" form:"publishAddress"`   //雇主地址
		Digest          *string `json:"digest" form:"digest"`                   //合同交易摘要
		EmployeeAddress *string `json:"employeeAddress" form:"employeeAddress"` //雇员地址
	}
	var req UpdateContractDigestReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}

	// 请添加自己的业务逻辑
	err = employeeInfoService.UpdateContractDigest(req.PublishAddress, req.EmployeeAddress, req.Digest)
	if err != nil {
		global.GVA_LOG.Error("失败!", zap.Error(err))
		response.FailWithMessage("失败", c)
		return
	}
	response.OkWithData("返回数据", c)
}
