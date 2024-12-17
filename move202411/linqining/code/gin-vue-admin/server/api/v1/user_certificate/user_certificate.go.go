package user_certificate

import (
	
	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate"
    user_certificateReq "github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

type UserCertificateApi struct {}



// CreateUserCertificate 创建用户资质
// @Tags UserCertificate
// @Summary 创建用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body user_certificate.UserCertificate true "创建用户资质"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /userCertificate/createUserCertificate [post]
func (userCertificateApi *UserCertificateApi) CreateUserCertificate(c *gin.Context) {
	var userCertificate user_certificate.UserCertificate
	err := c.ShouldBindJSON(&userCertificate)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = userCertificateService.CreateUserCertificate(&userCertificate)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteUserCertificate 删除用户资质
// @Tags UserCertificate
// @Summary 删除用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body user_certificate.UserCertificate true "删除用户资质"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /userCertificate/deleteUserCertificate [delete]
func (userCertificateApi *UserCertificateApi) DeleteUserCertificate(c *gin.Context) {
	ID := c.Query("ID")
	err := userCertificateService.DeleteUserCertificate(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteUserCertificateByIds 批量删除用户资质
// @Tags UserCertificate
// @Summary 批量删除用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /userCertificate/deleteUserCertificateByIds [delete]
func (userCertificateApi *UserCertificateApi) DeleteUserCertificateByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := userCertificateService.DeleteUserCertificateByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateUserCertificate 更新用户资质
// @Tags UserCertificate
// @Summary 更新用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body user_certificate.UserCertificate true "更新用户资质"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /userCertificate/updateUserCertificate [put]
func (userCertificateApi *UserCertificateApi) UpdateUserCertificate(c *gin.Context) {
	var userCertificate user_certificate.UserCertificate
	err := c.ShouldBindJSON(&userCertificate)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = userCertificateService.UpdateUserCertificate(userCertificate)
	if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindUserCertificate 用id查询用户资质
// @Tags UserCertificate
// @Summary 用id查询用户资质
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query user_certificate.UserCertificate true "用id查询用户资质"
// @Success 200 {object} response.Response{data=user_certificate.UserCertificate,msg=string} "查询成功"
// @Router /userCertificate/findUserCertificate [get]
func (userCertificateApi *UserCertificateApi) FindUserCertificate(c *gin.Context) {
	ID := c.Query("ID")
	reuserCertificate, err := userCertificateService.GetUserCertificate(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
	response.OkWithData(reuserCertificate, c)
}
// GetUserCertificateList 分页获取用户资质列表
// @Tags UserCertificate
// @Summary 分页获取用户资质列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query user_certificateReq.UserCertificateSearch true "分页获取用户资质列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /userCertificate/getUserCertificateList [get]
func (userCertificateApi *UserCertificateApi) GetUserCertificateList(c *gin.Context) {
	var pageInfo user_certificateReq.UserCertificateSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := userCertificateService.GetUserCertificateInfoList(pageInfo)
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

// GetUserCertificatePublic 不需要鉴权的用户资质接口
// @Tags UserCertificate
// @Summary 不需要鉴权的用户资质接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /userCertificate/getUserCertificatePublic [get]
func (userCertificateApi *UserCertificateApi) GetUserCertificatePublic(c *gin.Context) {
    // 此接口不需要鉴权
    // 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    userCertificateService.GetUserCertificatePublic()
    response.OkWithDetailed(gin.H{
       "info": "不需要鉴权的用户资质接口信息",
    }, "获取成功", c)
}
