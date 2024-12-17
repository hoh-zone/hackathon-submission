package company

import (
	"github.com/flipped-aurora/gin-vue-admin/server/global"
	"github.com/flipped-aurora/gin-vue-admin/server/model/company"
	companyReq "github.com/flipped-aurora/gin-vue-admin/server/model/company/request"
	"go.uber.org/zap"
)

type CompanyService struct{}

// CreateCompany 创建公司记录
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) CreateCompany(company_info *company.Company) (err error) {
	err = global.GVA_DB.Create(company_info).Error
	return err
}

// DeleteCompany 删除公司记录
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) DeleteCompany(ID string) (err error) {
	err = global.GVA_DB.Delete(&company.Company{}, "id = ?", ID).Error
	return err
}

// DeleteCompanyByIds 批量删除公司记录
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) DeleteCompanyByIds(IDs []string) (err error) {
	err = global.GVA_DB.Delete(&[]company.Company{}, "id in ?", IDs).Error
	return err
}

// UpdateCompany 更新公司记录
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) UpdateCompany(company_info company.Company) (err error) {
	err = global.GVA_DB.Model(&company.Company{}).Where("id = ?", company_info.ID).Updates(&company_info).Error
	return err
}

// GetCompany 根据ID获取公司记录
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) GetCompany(ID string) (company_info company.Company, err error) {
	err = global.GVA_DB.Where("id = ?", ID).First(&company_info).Error
	return
}

// GetCompanyInfoList 分页获取公司记录
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) GetCompanyInfoList(info companyReq.CompanySearch) (list []company.Company, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	// 创建db
	db := global.GVA_DB.Model(&company.Company{})
	var company_infos []company.Company
	// 如果有条件搜索 下方会自动创建搜索语句
	if info.StartCreatedAt != nil && info.EndCreatedAt != nil {
		db = db.Where("created_at BETWEEN ? AND ?", info.StartCreatedAt, info.EndCreatedAt)
	}
	if info.WalletAddress != nil && *info.WalletAddress != "" {
		db = db.Where("wallet_address = ?", *info.WalletAddress)
	}
	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if limit != 0 {
		db = db.Limit(limit).Offset(offset)
	}

	err = db.Find(&company_infos).Error
	return company_infos, total, err
}
func (company_infoService *CompanyService) GetCompanyPublic() {
	// 此方法为获取数据源定义的数据
	// 请自行实现
}

// BatchGetByAddress 批量获取公司信息
// Author [yourname](https://github.com/yourname)
func (company_infoService *CompanyService) BatchGetByAddress(addresses []string) (list []company.Company, err error) {
	db := global.GVA_DB.Model(&company.Company{})
	var company_infos []company.Company
	if len(addresses) > 0 {
		db = db.Where("wallet_address in (?)", addresses)
	}
	global.GVA_LOG.Debug("address", zap.Any("address", addresses))
	err = db.Find(&company_infos).Error
	return company_infos, err
}
