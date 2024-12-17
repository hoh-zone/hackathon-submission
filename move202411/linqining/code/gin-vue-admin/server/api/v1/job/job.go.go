package job

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/common/response"
	"github.com/flipped-aurora/gin-vue-admin/server/model/job"
	jobReq "github.com/flipped-aurora/gin-vue-admin/server/model/job/request"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"io"
)

type JobApi struct{}

// CreateJob 创建职位
// @Tags Job
// @Summary 创建职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job.Job true "创建职位"
// @Success 200 {object} response.Response{msg=string} "创建成功"
// @Router /job_info/createJob [post]
func (job_infoApi *JobApi) CreateJob(c *gin.Context) {
	var job_info job.Job
	err := c.ShouldBindJSON(&job_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = job_infoService.CreateJob(&job_info)
	if err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// DeleteJob 删除职位
// @Tags Job
// @Summary 删除职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job.Job true "删除职位"
// @Success 200 {object} response.Response{msg=string} "删除成功"
// @Router /job_info/deleteJob [delete]
func (job_infoApi *JobApi) DeleteJob(c *gin.Context) {
	id := c.Query("id")
	err := job_infoService.DeleteJob(id)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// DeleteJobByIds 批量删除职位
// @Tags Job
// @Summary 批量删除职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{msg=string} "批量删除成功"
// @Router /job_info/deleteJobByIds [delete]
func (job_infoApi *JobApi) DeleteJobByIds(c *gin.Context) {
	ids := c.QueryArray("ids[]")
	err := job_infoService.DeleteJobByIds(ids)
	if err != nil {
		global.GVA_LOG.Error("批量删除失败!", zap.Error(err))
		response.FailWithMessage("批量删除失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("批量删除成功", c)
}

// UpdateJob 更新职位
// @Tags Job
// @Summary 更新职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data body job.Job true "更新职位"
// @Success 200 {object} response.Response{msg=string} "更新成功"
// @Router /job_info/updateJob [put]
func (job_infoApi *JobApi) UpdateJob(c *gin.Context) {
	var job_info job.Job
	err := c.ShouldBindJSON(&job_info)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	err = job_infoService.UpdateJob(job_info)
	if err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败:"+err.Error(), c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// FindJob 用id查询职位
// @Tags Job
// @Summary 用id查询职位
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query job.Job true "用id查询职位"
// @Success 200 {object} response.Response{data=job.Job,msg=string} "查询成功"
// @Router /job_info/findJob [get]
func (job_infoApi *JobApi) FindJob(c *gin.Context) {
	id := c.Query("id")
	rejob_info, err := job_infoService.GetJob(id)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(rejob_info, c)
}

// GetJobList 分页获取职位列表
// @Tags Job
// @Summary 分页获取职位列表
// @Security ApiKeyAuth
// @accept application/json
// @Produce application/json
// @Param data query jobReq.JobSearch true "分页获取职位列表"
// @Success 200 {object} response.Response{data=response.PageResult,msg=string} "获取成功"
// @Router /job_info/getJobList [get]
func (job_infoApi *JobApi) GetJobList(c *gin.Context) {
	var pageInfo jobReq.JobSearch
	err := c.ShouldBindQuery(&pageInfo)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := job_infoService.GetJobInfoList(pageInfo)
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

// GetJobPublic 不需要鉴权的职位接口
// @Tags Job
// @Summary 不需要鉴权的职位接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /job_info/getJobPublic [get]
func (job_infoApi *JobApi) GetJobPublic(c *gin.Context) {
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	job_infoService.GetJobPublic()
	response.OkWithDetailed(gin.H{
		"info": "不需要鉴权的职位接口信息",
	}, "获取成功", c)
}

// GetJobPublic 不需要鉴权的职位接口
// @Tags Job
// @Summary 不需要鉴权的职位接口
// @accept application/json
// @Produce application/json
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /job_info/ListJobs [get]
func (job_infoApi *JobApi) ListJobs(c *gin.Context) {
	type ListJobReq struct {
		Address string `json:"address"`
	}
	var l ListJobReq
	err := c.ShouldBindJSON(&l)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		data, _ := io.ReadAll(c.Request.Body)
		global.GVA_LOG.Error("Bind json failed error!", zap.Error(err), zap.String("data",
			string(data)))
		return
	}
	// 此接口不需要鉴权
	// 示例为返回了一个固定的消息接口，一般本接口用于C端服务，需要自己实现业务逻辑
	list, total, err := job_infoService.ListJobs(l.Address)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败:"+err.Error(), c)
		return
	}
	response.OkWithDetailed(response.PageResult{
		List:  list,
		Total: total,
		//Page:     pageInfo.Page,
		//PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}

// GetJob getJob
// @Tags Job
// @Summary getJob
// @accept application/json
// @Produce application/json
// @Param data query jobReq.JobSearch true "成功"
// @Success 200 {object} response.Response{data=object,msg=string} "成功"
// @Router /job_info/getJob [GET]
func (job_infoApi *JobApi) GetJob(c *gin.Context) {
	// 请添加自己的业务逻辑
	id := c.Query("id")
	rejob_info, err := job_infoService.GetJob(id)
	if err != nil {
		global.GVA_LOG.Error("查询失败!", zap.Error(err))
		response.FailWithMessage("查询失败:"+err.Error(), c)
		return
	}
	response.OkWithData(rejob_info, c)
}
