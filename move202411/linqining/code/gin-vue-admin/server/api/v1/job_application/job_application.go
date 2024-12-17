package job_application

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job_application"
	job_applicationReq "github.com/flipped-aurora/gin-vue-admin/server/model/job_application/request"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type JobApplicationApi struct{}

// CreateJobApplication 创建职位申请
// @Tags JobApplication
// @Summary 创建职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job_application.JobApplication true "创建职位申请"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /jobApplication/createJobApplication [post]
func (jobApplicationApi *JobApplicationApi) CreateJobApplication(c *gin.Context) {
	var jobApplication job_application.JobApplication
	err := c.ShouldBindJSON(&jobApplication)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = jobApplicationService.CreateJobApplication(&jobApplication)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteJobApplication 删除职位申请
// @Tags JobApplication
// @Summary 删除职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job_application.JobApplication true "删除职位申请"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /jobApplication/deleteJobApplication [delete]
func (jobApplicationApi *JobApplicationApi) DeleteJobApplication(c *gin.Context) {
	ID := c.Query("ID")
	err := jobApplicationService.DeleteJobApplication(ID)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteJobApplicationByIds 批量删除职位申请
// @Tags JobApplication
// @Summary 批量删除职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /jobApplication/deleteJobApplicationByIds [delete]
func (jobApplicationApi *JobApplicationApi) DeleteJobApplicationByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := jobApplicationService.DeleteJobApplicationByIds(IDs)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateJobApplication 更新职位申请
// @Tags JobApplication
// @Summary 更新职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job_application.JobApplication true "更新职位申请"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /jobApplication/updateJobApplication [put]
func (jobApplicationApi *JobApplicationApi) UpdateJobApplication(c *gin.Context) {
	var jobApplication job_application.JobApplication
	err := c.ShouldBindJSON(&jobApplication)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = jobApplicationService.UpdateJobApplication(jobApplication)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindJobApplication 用id查询职位申请
// @Tags JobApplication
// @Summary 用id查询职位申请
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query job_application.JobApplication true "用id查询职位申请"
// @Success 200 {object} response.Response{data=job_application.JobApplication,msg=string} "查询成功"
// @Router /jobApplication/findJobApplication [get]
func (jobApplicationApi *JobApplicationApi) FindJobApplication(c *gin.Context) {
	ID := c.Query("ID")
	rejobApplication, err := jobApplicationService.GetJobApplication(ID)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(rejobApplication, c)
}

// GetJobApplicationList 分页获取职位申请列表
// @Tags JobApplication
// @Summary 分页获取职位申请列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query job_applicationReq.JobApplicationSearch true "分页获取职位申请列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /jobApplication/getJobApplicationList [get]
func (jobApplicationApi *JobApplicationApi) GetJobApplicationList(c *gin.Context) {
	var pageInfo job_applicationReq.JobApplicationSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := jobApplicationService.GetJobApplicationInfoList(pageInfo)
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

// GetJobApplicationPublic 不需要鉴权的职位申请接口
// @Tags JobApplication
// @Summary 不需要鉴权的职位申请接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /jobApplication/getJobApplicationPublic [get]
func (jobApplicationApi *JobApplicationApi) GetJobApplicationPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	jobApplicationService.GetJobApplicationPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的职位申请接口信息",
	}, "获取成功", c)
}

// UserApply 申请职位
// @Tags JobApplication
// @Summary 申请职位
// @accept application/json
// @Produce application/json
// @Param data query job_applicationReq.JobApplicationSearch true "成功"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /jobApplication/userApply [POST]
func (jobApplicationApi *JobApplicationApi) UserApply(c *gin.Context) {
	var jobApplication job_application.JobApplication
	err := c.ShouldBindJSON(&jobApplication)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = jobApplicationService.UserApply(&jobApplication)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)

}

// UpdateDigest Offer交易摘要回填
// @Tags JobApplication
// @Summary Offer交易摘要回填
// @accept application/json
// @Produce application/json
// @Param data query job_applicationReq.JobApplicationSearch true "成功"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /jobApplication/updateDigest [POST]
func (jobApplicationApi *JobApplicationApi) UpdateDigest(c *gin.Context) {
	var jobApplication job_application.JobApplication
	err := c.ShouldBindJSON(&jobApplication)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = jobApplicationService.UpdateDigest(jobApplication)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}
