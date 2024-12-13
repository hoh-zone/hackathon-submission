
package user_certificate

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate"
    user_certificateReq "github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate/request"
)

type UserCertificateService struct {}
// CreateUserCertificate 创建用户资质记录
// Author [yourname](https://github.com/yourname)
func (userCertificateService *UserCertificateService) CreateUserCertificate(userCertificate *user_certificate.UserCertificate) (err error) {
	err = global.GVA_DB.Create(userCertificate).Error
	return err
}

// DeleteUserCertificate 删除用户资质记录
// Author [yourname](https://github.com/yourname)
func (userCertificateService *UserCertificateService)DeleteUserCertificate(ID string) (err error) {
	err = global.GVA_DB.Delete(&user_certificate.UserCertificate{},"id = ?",ID).Error
	return err
}

// DeleteUserCertificateByIds 批量删除用户资质记录
// Author [yourname](https://github.com/yourname)
func (userCertificateService *UserCertificateService)DeleteUserCertificateByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]user_certificate.UserCertificate{},"id in ?",IDs).Error
	return err
}

// UpdateUserCertificate 更新用户资质记录
// Author [yourname](https://github.com/yourname)
func (userCertificateService *UserCertificateService)UpdateUserCertificate(userCertificate user_certificate.UserCertificate) (err error) {
	err = global.GVA_DB.Model(&user_certificate.UserCertificate{}).Where("id = ?",userCertificate.ID).Updates(&userCertificate).Error
	return err
}

// GetUserCertificate 根据ID获取用户资质记录
// Author [yourname](https://github.com/yourname)
func (userCertificateService *UserCertificateService)GetUserCertificate(ID string) (userCertificate user_certificate.UserCertificate, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&userCertificate).Error
	return
}
// GetUserCertificateInfoList 分页获取用户资质记录
// Author [yourname](https://github.com/yourname)
func (userCertificateService *UserCertificateService)GetUserCertificateInfoList(info user_certificateReq.UserCertificateSearch) (list []user_certificate.UserCertificate, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&user_certificate.UserCertificate{})
    var userCertificates []user_certificate.UserCertificate
    // 如果有条件搜索 下方会自动创建搜索语句
    if info.StartCreatedAt !=nil && info.EndCreatedAt !=nil {
     db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
    }
	err = db.Count(&total).Error
	if err!=nil {
    	return
    }

	if limit != 0 {
       db = db.Limit(limit).Offset(offset)
    }

	err = db.Find(&userCertificates).Error
	return  userCertificates, total, err
}
func (userCertificateService *UserCertificateService)GetUserCertificatePublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
