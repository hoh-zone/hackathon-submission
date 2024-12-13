package user

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user"
	userReq "github.com/flipped-aurora/gin-vue-admin/server/model/user/request"
	"github.com/gin-gonic/gin"
	"github.com/google/martian/log"
	"go.uber.org/zap"
	"io"
)

type UserApi struct{}

// CreateUser 创建用户
// @Tags User
// @Summary 创建用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body user.User true "创建用户"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /user_info/createUser [post]
func (user_infoApi *UserApi) CreateUser(c *gin.Context) {
	var user_info user.User
	err := c.ShouldBindJSON(&user_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = user_infoService.CreateUser(&user_info)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteUser 删除用户
// @Tags User
// @Summary 删除用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body user.User true "删除用户"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /user_info/deleteUser [delete]
func (user_infoApi *UserApi) DeleteUser(c *gin.Context) {
	ID := c.Query("ID")
	err := user_infoService.DeleteUser(ID)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteUserByIds 批量删除用户
// @Tags User
// @Summary 批量删除用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /user_info/deleteUserByIds [delete]
func (user_infoApi *UserApi) DeleteUserByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := user_infoService.DeleteUserByIds(IDs)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateUser 更新用户
// @Tags User
// @Summary 更新用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body user.User true "更新用户"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /user_info/updateUser [put]
func (user_infoApi *UserApi) UpdateUser(c *gin.Context) {
	var user_info user.User
	err := c.ShouldBindJSON(&user_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = user_infoService.UpdateUser(user_info)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindUser 用id查询用户
// @Tags User
// @Summary 用id查询用户
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query user.User true "用id查询用户"
// @Success 200 {object} response.Response{data=user.User,msg=string} "查询成功"
// @Router /user_info/findUser [get]
func (user_infoApi *UserApi) FindUser(c *gin.Context) {
	ID := c.Query("ID")
	reuser_info, err := user_infoService.GetUser(ID)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(reuser_info, c)
}

// GetUserList 分页获取用户列表
// @Tags User
// @Summary 分页获取用户列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query userReq.UserSearch true "分页获取用户列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /user_info/getUserList [get]
func (user_infoApi *UserApi) GetUserList(c *gin.Context) {
	var pageInfo userReq.UserSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := user_infoService.GetUserInfoList(pageInfo)
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

// GetUserPublic 不需要鉴权的用户接口
// @Tags User
// @Summary 不需要鉴权的用户接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /user_info/getUserPublic [get]
func (user_infoApi *UserApi) GetUserPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	user_infoService.GetUserPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的用户接口信息",
	}, "获取成功", c)
}

// GetUserPublic 不需要鉴权的用户接口
// @Tags User
// @Summary 不需要鉴权的用户接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /user_info/LoginByAddress [get]
func (user_infoApi *UserApi) LoginByAddress(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	type AddressLogin struct {
		Address string `json:"address"`
	}
	var l AddressLogin
	err := c.ShouldBindJSON(&l)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		data, _ := io.ReadAll(c.Request.Body)
		log.Errorf("Bind json failed %s body:%s", err, string(data))
		return
	}

	user_infoService.LoginByAddress(l.Address)
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的用户接口信息",
	}, "获取成功", c)
}

// GetUserPublic 不需要鉴权的用户接口
// @Tags User
// @Summary 不需要鉴权的用户接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /user_info/UserGetCertificate [post]
func (user_infoApi *UserApi) UserGetCertificate(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	type UserGetCertificate struct {
		UserAddress string `json:"address"`
		Certificate string `json:"certificate"`
	}
	var l UserGetCertificate
	err := c.ShouldBindJSON(&l)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		data, _ := io.ReadAll(c.Request.Body)
		log.Errorf("Bind json failed %s body:%s", err, string(data))
		return
	}

	user_infoService.UserGetCertificate(l.UserAddress, l.Certificate)
	response.OkWithDetailed(gin.H{
		"info": "提交认证信息",
	}, "获取成功", c)
}
