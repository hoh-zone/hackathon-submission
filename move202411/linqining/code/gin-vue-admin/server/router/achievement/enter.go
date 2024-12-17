package achievement

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ AchievementRouter }

var achievement_infoApi = api.ApiGroupApp.AchievementApiGroup.AchievementApi
