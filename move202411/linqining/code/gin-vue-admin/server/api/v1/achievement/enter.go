package achievement

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ AchievementApi }

var achievement_infoService = service.ServiceGroupApp.AchievementServiceGroup.AchievementService
