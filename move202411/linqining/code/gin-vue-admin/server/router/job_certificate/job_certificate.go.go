package job_certificate

import (
	"github.com/flipped-aurora/gin-vue-admin/server/middleware"
	"github.com/gin-gonic/gin"
)

type JobCertificateRouter struct {}

// InitJobCertificateRouter 初始化 职位资格要求 路由信息
func (s *JobCertificateRouter) InitJobCertificateRouter(Router *gin.RouterGroup,PublicRouter *gin.RouterGroup) {
	jobCertificateRouter := Router.Group("jobCertificate").Use(middleware.OperationRecord())
	jobCertificateRouterWithoutRecord := Router.Group("jobCertificate")
	jobCertificateRouterWithoutAuth := PublicRouter.Group("jobCertificate")
	{
		jobCertificateRouter.POST("createJobCertificate", jobCertificateApi.CreateJobCertificate)   // 新建职位资格要求
		jobCertificateRouter.DELETE("deleteJobCertificate", jobCertificateApi.DeleteJobCertificate) // 删除职位资格要求
		jobCertificateRouter.DELETE("deleteJobCertificateByIds", jobCertificateApi.DeleteJobCertificateByIds) // 批量删除职位资格要求
		jobCertificateRouter.PUT("updateJobCertificate", jobCertificateApi.UpdateJobCertificate)    // 更新职位资格要求
	}
	{
		jobCertificateRouterWithoutRecord.GET("findJobCertificate", jobCertificateApi.FindJobCertificate)        // 根据ID获取职位资格要求
		jobCertificateRouterWithoutRecord.GET("getJobCertificateList", jobCertificateApi.GetJobCertificateList)  // 获取职位资格要求列表
	}
	{
	    jobCertificateRouterWithoutAuth.GET("getJobCertificatePublic", jobCertificateApi.GetJobCertificatePublic)  // 职位资格要求开放接口
	}
}
