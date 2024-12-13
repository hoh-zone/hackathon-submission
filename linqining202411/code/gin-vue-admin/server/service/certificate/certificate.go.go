
package certificate

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/certificate"
    certificateReq "github.com/flipped-aurora/gin-vue-admin/server/model/certificate/request"
)

type CertificateService struct {}
// CreateCertificate 创建资质记录
// Author [yourname](https://github.com/yourname)
func (certificatesService *CertificateService) CreateCertificate(certificates *certificate.Certificate) (err error) {
	err = global.GVA_DB.Create(certificates).Error
	return err
}

// DeleteCertificate 删除资质记录
// Author [yourname](https://github.com/yourname)
func (certificatesService *CertificateService)DeleteCertificate(ID string) (err error) {
	err = global.GVA_DB.Delete(&certificate.Certificate{},"id = ?",ID).Error
	return err
}

// DeleteCertificateByIds 批量删除资质记录
// Author [yourname](https://github.com/yourname)
func (certificatesService *CertificateService)DeleteCertificateByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]certificate.Certificate{},"id in ?",IDs).Error
	return err
}

// UpdateCertificate 更新资质记录
// Author [yourname](https://github.com/yourname)
func (certificatesService *CertificateService)UpdateCertificate(certificates certificate.Certificate) (err error) {
	err = global.GVA_DB.Model(&certificate.Certificate{}).Where("id = ?",certificates.ID).Updates(&certificates).Error
	return err
}

// GetCertificate 根据ID获取资质记录
// Author [yourname](https://github.com/yourname)
func (certificatesService *CertificateService)GetCertificate(ID string) (certificates certificate.Certificate, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&certificates).Error
	return
}
// GetCertificateInfoList 分页获取资质记录
// Author [yourname](https://github.com/yourname)
func (certificatesService *CertificateService)GetCertificateInfoList(info certificateReq.CertificateSearch) (list []certificate.Certificate, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
    // 创建db
	db := global.GVA_DB.Model(&certificate.Certificate{})
    var certificatess []certificate.Certificate
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

	err = db.Find(&certificatess).Error
	return  certificatess, total, err
}
func (certificatesService *CertificateService)GetCertificatePublic() {
    // 此方法为获取数据源定义的数据
    // 请自行实现
}
