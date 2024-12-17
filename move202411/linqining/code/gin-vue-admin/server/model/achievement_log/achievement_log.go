// 自动生成模板AchievementLog
package achievement_log

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
)

// 奖励记录 结构体  AchievementLog
type AchievementLog struct {
	global.GVA_MODEL
	Digest            *string `json:"digest" form:"digest" gorm:"column:digest;comment:;size:100;"`                                  //交易digest
	Receiver_address  *string `json:"receiver_address" form:"receiver_address" gorm:"column:receiver_address;comment:;size:100;"`    //获奖人地址
	Sender_address    *string `json:"sender_address" form:"sender_address" gorm:"column:sender_address;comment:;size:100;"`          //发奖人地址
	Sui_amount        *int    `json:"sui_amount" form:"sui_amount" gorm:"column:sui_amount;comment:;size:100;"`                      //奖金(SUI)
	Achievement_name  *string `json:"achievement_name" form:"achievement_name" gorm:"column:achievement_name;comment:;size:100;"`    //成就名
	Achievement_image *string `json:"achievement_image" form:"achievement_image" gorm:"column:achievement_image;comment:;size:100;"` //图片
	Achievement_id    *string `json:"achievement_id" form:"achievement_id" gorm:"column:achievement_id;comment:;size:100;"`          //成就ObjectID
}

// TableName 奖励记录 AchievementLog自定义表名 achievement_log
func (AchievementLog) TableName() string {
	return "achievement_log"
}
