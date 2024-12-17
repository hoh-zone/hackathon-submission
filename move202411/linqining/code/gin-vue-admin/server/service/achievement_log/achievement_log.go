
package achievement_log

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/achievement_log"
    achievement_logReq "github.com/flipped-aurora/gin-vue-admin/server/model/achievement_log/request"
)

type AchievementLogService struct {}
// CreateAchievementLog 创建奖励记录记录
// Author [yourname](https://github.com/yourname)
func (achievementlogService *AchievementLogService) CreateAchievementLog(achievementlog *achievement_log.AchievementLog) (err error) {
	err = global.GVA_DB.Create(achievementlog).Error
	return err
}

// DeleteAchievementLog 删除奖励记录记录
// Author [yourname](https://github.com/yourname)
func (achievementlogService *AchievementLogService)DeleteAchievementLog(ID string) (err error) {
	err = global.GVA_DB.Delete(&achievement_log.AchievementLog{},"id = ?",ID).Error
	return err
}

// DeleteAchievementLogByIds 批量删除奖励记录记录
// Author [yourname](https://github.com/yourname)
func (achievementlogService *AchievementLogService)DeleteAchievementLogByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]achievement_log.AchievementLog{},"id in ?",IDs).Error
	return err
}

// UpdateAchievementLog 更新奖励记录记录
// Author [yourname](https://github.com/yourname)
func (achievementlogService *AchievementLogService)UpdateAchievementLog(achievementlog achievement_log.AchievementLog) (err error) {
	err = global.GVA_DB.Model(&achievement_log.AchievementLog{}).Where("id = ?",achievementlog.ID).Updates(&achievementlog).Error
	return err
}

// GetAchievementLog 根据ID获取奖励记录记录
// Author [yourname](https://github.com/yourname)
func (achievementlogService *AchievementLogService)GetAchievementLog(ID string) (achievementlog achievement_log.AchievementLog, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&achievementlog).Error
	return
}
// GetAchievementLogInfoList 分页获取奖励记录记录
// Author [yourname](https://github.com/yourname)
func (achievementlogService *AchievementLogService)GetAchievementLogInfoList(info achievement_logReq.AchievementLogSearch) (list []achievement_log.AchievementLog, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&achievement_log.AchievementLog{})
    var achievementlogs []achievement_log.AchievementLog
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
    if info.Receiver_address != nil && *info.Receiver_address != "" {
        db = db.Where("receiver_address = ?",*info.Receiver_address)
    }
    if info.Sender_address != nil && *info.Sender_address != "" {
        db = db.Where("sender_address = ?",*info.Sender_address)
    }
        if info.StartSui_amount != nil && info.EndSui_amount != nil {
            db = db.Where("sui_amount BETWEEN ? AND ? ",info.StartSui_amount,info.EndSui_amount)
        }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }

	err = db.Find(&achievementlogs).Error
	return  achievementlogs, total, err
}
func (achievementlogService *AchievementLogService)GetAchievementLogPublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
