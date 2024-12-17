package user

import api "github.com/flipped-aurora/gin-vue-admin/server/api/v1"

type RouterGroup struct{ UserRouter }

var user_infoApi = api.ApiGroupApp.UserApiGroup.UserApi
