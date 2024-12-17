package job_application

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type JobApplicationRouter struct{}

func (s *JobApplicationRouter) InitJobApplicationRouter(Router *gin.RouterGroup, PublicRouter *gin.RouterGroup) {
	jobApplicationRouter := Router.Group("jobApplication").Use(middleware.OperationRecord())
	jobApplicationRouterWithoutRecord := Router.Group("jobApplication")
	jobApplicationRouterWithoutAuth := PublicRouter.Group("jobApplication")
	{
		jobApplicationRouter.POST("createJobApplication", jobApplicationApi.CreateJobApplication)
		jobApplicationRouter.DELETE("deleteJobApplication", jobApplicationApi.DeleteJobApplication)
		jobApplicationRouter.DELETE("deleteJobApplicationByIds", jobApplicationApi.DeleteJobApplicationByIds)
		jobApplicationRouter.PUT("updateJobApplication", jobApplicationApi.UpdateJobApplication)
	}
	{
		jobApplicationRouterWithoutRecord.GET("findJobApplication", jobApplicationApi.FindJobApplication)
		jobApplicationRouterWithoutRecord.GET("getJobApplicationList", jobApplicationApi.GetJobApplicationList)
	}
	{
		jobApplicationRouterWithoutAuth.GET("getJobApplicationPublic", jobApplicationApi.GetJobApplicationPublic)
		jobApplicationRouterWithoutAuth.POST("userApply", jobApplicationApi.UserApply)
		jobApplicationRouterWithoutAuth.POST("updateDigest", jobApplicationApi.UpdateDigest)
	}
}
