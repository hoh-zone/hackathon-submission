package user

import "github.com/flipped-aurora/gin-vue-admin/server/service"

type ApiGroup struct{ UserApi }

var user_infoService = service.ServiceGroupApp.UserServiceGroup.UserService
