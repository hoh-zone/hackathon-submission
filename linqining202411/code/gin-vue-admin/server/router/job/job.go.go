package job

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type JobRouter struct{}

// InitJobRouter 初始化 职位 路由信息
func (s *JobRouter) InitJobRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	job_infoRouter := Router.Group("job_info").Use(middleware.OperationRecord())
	job_infoRouterWithoutRecord := Router.Group("job_info")
	job_infoRouterWithoutAuth := PublicRouter.Group("job_info")
	{
		job_infoRouter.POST("createJob", job_infoApi.CreateJob)             // 新建职位
		job_infoRouter.DELETE("deleteJob", job_infoApi.DeleteJob)           // 删除职位
		job_infoRouter.DELETE("deleteJobByIds", job_infoApi.DeleteJobByIds) // 批量删除职位
		job_infoRouter.PUT("updateJob", job_infoApi.UpdateJob)              // 更新职位
	}
	{
		job_infoRouterWithoutRecord.GET("findJob", job_infoApi.FindJob)       // 根据ID获取职位
		job_infoRouterWithoutRecord.GET("getJobList", job_infoApi.GetJobList) // 获取职位列表
	}
	{
		job_infoRouterWithoutAuth.GET("getJobPublic", job_infoApi.GetJobPublic) // 职位开放接口
	}
	{
		job_infoRouterWithoutAuth.POST("ListJobs", job_infoApi.ListJobs) // 职位开放接口
	}
}
