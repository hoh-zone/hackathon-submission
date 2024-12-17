import service from '@/utils/request'
// @Tags Job
// @Summary 不需要鉴权的职位接口
// @accept application/json
// @Produce application/json
// @Param data query jobReq.JobSearch true "分页获取职位列表"
// @Success 200 {object} response.Response{data=object,msg=string} "获取成功"
// @Router /job_info/ListJobs [post]
export const ListJobs = (data) => {
    return service({
        url: '/job_info/ListJobs',
        method: 'post',
        data:data,
    })
}
