package initialize

import (
	"github.com/flipped-aurora/gin-vue-admin/server/router"
	"github.com/gin-gonic/gin"
)

func holder(routers ...*gin.RouterGroup) {
	_ = routers
	_ = router.RouterGroupApp
}
func initBizRouter(routers ...*gin.RouterGroup) {
	privateGroup := routers[0]
	publicGroup := routers[1]
	holder(publicGroup, privateGroup)
	{
		companyRouter := router.RouterGroupApp.Company
		companyRouter.InitCompanyRouter(privateGroup, publicGroup)
	}
	{
		userRouter := router.RouterGroupApp.User
		userRouter.InitUserRouter(privateGroup, publicGroup)
	}
	{
		jobRouter := router.RouterGroupApp.Job
		jobRouter.InitJobRouter(privateGroup, publicGroup)
	}
	{
		certificateRouter := router.RouterGroupApp.Certificate
		certificateRouter.InitCertificateRouter(privateGroup, publicGroup)
	}
	{
		job_certificateRouter := router.RouterGroupApp.Job_certificate
		job_certificateRouter.InitJobCertificateRouter(privateGroup, publicGroup)
	}
	{
		user_certificateRouter := router.RouterGroupApp.User_certificate
		user_certificateRouter.InitUserCertificateRouter(privateGroup, publicGroup)
	} // 占位方法，保证文件可以正确加载，避免go空变量检测报错，请勿删除。
	{
		employeeRouter := router.RouterGroupApp.Employee
		employeeRouter.InitEmployeeRouter(privateGroup, publicGroup)
	}
}
