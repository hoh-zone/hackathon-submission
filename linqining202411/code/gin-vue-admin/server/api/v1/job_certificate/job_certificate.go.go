package job_certificate

import (
	
	"github.com/flipped-aurora/gin-vue-admin/server/global"
    "github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
    "github.com/flipped-aurora/gin-vue-admin/server/model/job_certificate"
    job_certificateReq "github.com/flipped-aurora/gin-vue-admin/server/model/job_certificate/request"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

type JobCertificateApi struct {}



// CreateJobCertificate 创建职位资格要求
// @Tags JobCertificate
// @Summary 创建职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job_certificate.JobCertificate true "创建职位资格要求"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /jobCertificate/createJobCertificate [post]
func (jobCertificateApi *JobCertificateApi) CreateJobCertificate(c *gin.Context) {
	var jobCertificate job_certificate.JobCertificate
	err := c.ShouldBindJSON(&jobCertificate)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = jobCertificateService.CreateJobCertificate(&jobCertificate)
	if err != nil {
        global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:" + err.Error(), c)
		return
	}
    response.OkWithMessage("创建成功", c)
}

// DeleteJobCertificate 删除职位资格要求
// @Tags JobCertificate
// @Summary 删除职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job_certificate.JobCertificate true "删除职位资格要求"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /jobCertificate/deleteJobCertificate [delete]
func (jobCertificateApi *JobCertificateApi) DeleteJobCertificate(c *gin.Context) {
	ID := c.Query("ID")
	err := jobCertificateService.DeleteJobCertificate(ID)
	if err != nil {
        global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteJobCertificateByIds 批量删除职位资格要求
// @Tags JobCertificate
// @Summary 批量删除职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /jobCertificate/deleteJobCertificateByIds [delete]
func (jobCertificateApi *JobCertificateApi) DeleteJobCertificateByIds(c *gin.Context) {
	IDs := c.QueryArray("IDs[]")
	err := jobCertificateService.DeleteJobCertificateByIds(IDs)
	if err != nil {
        global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateJobCertificate 更新职位资格要求
// @Tags JobCertificate
// @Summary 更新职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job_certificate.JobCertificate true "更新职位资格要求"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /jobCertificate/updateJobCertificate [put]
func (jobCertificateApi *JobCertificateApi) UpdateJobCertificate(c *gin.Context) {
	var jobCertificate job_certificate.JobCertificate
	err := c.ShouldBindJSON(&jobCertificate)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = jobCertificateService.UpdateJobCertificate(jobCertificate)
	if err != nil {
        global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:" + err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindJobCertificate 用id查询职位资格要求
// @Tags JobCertificate
// @Summary 用id查询职位资格要求
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query job_certificate.JobCertificate true "用id查询职位资格要求"
// @Success 200 {object} response.Response{data=job_certificate.JobCertificate,msg=string} "查询成功"
// @Router /jobCertificate/findJobCertificate [get]
func (jobCertificateApi *JobCertificateApi) FindJobCertificate(c *gin.Context) {
	ID := c.Query("ID")
	rejobCertificate, err := jobCertificateService.GetJobCertificate(ID)
	if err != nil {
        global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:" + err.Error(), c)
		return
	}
	response.OkWithData(rejobCertificate, c)
}
// GetJobCertificateList 分页获取职位资格要求列表
// @Tags JobCertificate
// @Summary 分页获取职位资格要求列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query job_certificateReq.JobCertificateSearch true "分页获取职位资格要求列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /jobCertificate/getJobCertificateList [get]
func (jobCertificateApi *JobCertificateApi) GetJobCertificateList(c *gin.Context) {
	var pageInfo job_certificateReq.JobCertificateSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := jobCertificateService.GetJobCertificateInfoList(pageInfo)
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

// GetJobCertificatePublic 不需要鉴权的职位资格要求接口
// @Tags JobCertificate
// @Summary 不需要鉴权的职位资格要求接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /jobCertificate/getJobCertificatePublic [get]
func (jobCertificateApi *JobCertificateApi) GetJobCertificatePublic(c *gin.Context) {
    // 此接口不需要鉴权
    // 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
    jobCertificateService.GetJobCertificatePublic()
    response.OkWithDetailed(gin.H{
       "info": "不需要鉴权的职位资格要求接口信息",
    }, "获取成功", c)
}
