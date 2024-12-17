package job

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type JobRouter struct{}

func (s *JobRouter) InitJobRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	job_infoRouter := Router.Group("job_info").Use(middleware.OperationRecord())
	job_infoRouterWithoutRecord := Router.Group("job_info")
	job_infoRouterWithoutAuth := PublicRouter.Group("job_info")
	{
		job_infoRouter.POST("createJob", job_infoApi.CreateJob)
		job_infoRouter.DELETE("deleteJob", job_infoApi.DeleteJob)
		job_infoRouter.DELETE("deleteJobByIds", job_infoApi.DeleteJobByIds)
		job_infoRouter.PUT("updateJob", job_infoApi.UpdateJob)
	}
	{
		job_infoRouterWithoutRecord.GET("findJob", job_infoApi.FindJob)
		job_infoRouterWithoutRecord.GET("getJobList", job_infoApi.GetJobList)
	}
	{
		job_infoRouterWithoutAuth.GET("getJobPublic", job_infoApi.GetJobPublic)
	}
	{
		job_infoRouterWithoutAuth.POST("ListJobs", job_infoApi.ListJobs)
		job_infoRouterWithoutAuth.GET("getJob", job_infoApi.GetJob)
	}
}
