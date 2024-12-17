package achievement_log

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ AchievementLogApi }

var achievementlogService = service.ServiceGroupApp.Achievement_logServiceGroup.AchievementLogService
