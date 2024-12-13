package user

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	certificate2 "github.com/flipped-aurora/gin-vue-admin/server/model/certificate"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user"
	userReq "github.com/flipped-aurora/gin-vue-admin/server/model/user/request"
	"github.com/flipped-aurora/gin-vue-admin/server/model/user_certificate"
)

type UserService struct{}

// CreateUser 创建用户记录
// Author [yourname](https://github.com/yourname)
func (user_infoService *UserService) CreateUser(user_info *user.User) (err error) {
	err = global.GVA_DB.Create(user_info).Error
	return err
}

// DeleteUser 删除用户记录
// Author [yourname](https://github.com/yourname)
func (user_infoService *UserService) DeleteUser(ID string) (err error) {
	err = global.GVA_DB.Delete(&user.User{}, "id = ?", ID).Error
	return err
}

// DeleteUserByIds 批量删除用户记录
// Author [yourname](https://github.com/yourname)
func (user_infoService *UserService) DeleteUserByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]user.User{}, "id in ?", IDs).Error
	return err
}

// UpdateUser 更新用户记录
// Author [yourname](https://github.com/yourname)
func (user_infoService *UserService) UpdateUser(user_info user.User) (err error) {
	err = global.GVA_DB.Model(&user.User{}).Where("id = ?", user_info.ID).Updates(&user_info).Error
	return err
}

// GetUser 根据ID获取用户记录
// Author [yourname](https://github.com/yourname)
func (user_infoService *UserService) GetUser(ID string) (user_info user.User, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&user_info).Error
	return
}

// GetUserInfoList 分页获取用户记录
// Author [yourname](https://github.com/yourname)
func (user_infoService *UserService) GetUserInfoList(info userReq.UserSearch) (list []user.User, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	// 创建db
	db := global.GVA_DB.Model(&user.User{})
	var user_infos []user.User
	// 如果有条件搜索 下方会自动创建搜索语句
	if info.StartCreatedAt != nil && info.EndCreatedAt != nil {
		db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
	}
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if limit != 0 {
		db = db.Limit(limit).Offset(offset)
	}

	err = db.Find(&user_infos).Error
	return user_infos, total, err
}
func (user_infoService *UserService) GetUserPublic() {
	// 此方法为获取数据源定义的数据
	// 请自行实现
}

func (user_infoService *UserService) LoginByAddress(address string) (err error) {
	user := &user.User{
		Address: &address,
	}
	err = global.GVA_DB.FirstOrCreate(user).Error
	return err
}

func (user_infoService *UserService) UserGetCertificate(address string, certificateAddress string) (err error) {
	user := &user.User{
		Address: &address,
	}
	err = global.GVA_DB.Where("address=?", address).FirstOrCreate(user).Error
	if err != nil {
		return err
	}

	certificate := &certificate2.Certificate{
		Address: &certificateAddress,
	}

	err = global.GVA_DB.Where("address=?", address).FirstOrCreate(certificate).Error
	if err != nil {
		return err
	}

	userID := int(user.ID)
	cerID := int(certificate.ID)
	err = global.GVA_DB.Create(&user_certificate.UserCertificate{
		UserId:        &userID,
		CertificateId: &cerID,
	}).Error
	return err
}
