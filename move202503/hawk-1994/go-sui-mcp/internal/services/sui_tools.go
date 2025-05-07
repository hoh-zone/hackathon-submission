package services

import (


	"github.com/mark3labs/mcp-go/mcp"
	// "github.com/mark3labs/mcp-go/server"
)

type SuiTools struct {
}

func NewSuiTools() *SuiTools {
	return &SuiTools{}
}

func (s *SuiTools) GetFormattedVersion() mcp.Tool {
	return mcp.NewTool(
		"sui-formatted-version",
		mcp.WithDescription("Get the formatted version of the Sui client"),
	)
}

func (s *SuiTools) GetSuiPath() mcp.Tool {
	return mcp.NewTool(
		"sui-path",
		mcp.WithDescription("Get the path of the local sui binary"),
	)
}

func (s *SuiTools) GetBalanceSummary() mcp.Tool {
	return mcp.NewTool(
		"sui-balance-summary",
		mcp.WithString("address",
			mcp.Description("Address to get the balance summary of, if not provided, the current address will be used"),
		),
		mcp.WithDescription("Get the balance summary of the Sui client"),
	)
}

func (s *SuiTools) GetObjectsSummary() mcp.Tool {
	return mcp.NewTool(
		"sui-objects-summary",
		mcp.WithString("address",
			mcp.Description("Address to get the objects summary of, if not provided, the current address will be used"),
		),
		mcp.WithDescription("Get the objects summary of the Sui client"),
	)
}

func (s *SuiTools) GetObject() mcp.Tool {
	return mcp.NewTool(
		"sui-object",
		mcp.WithString("objectID",
			mcp.Required(),
			mcp.Description("Object ID to get"),
		),
		mcp.WithDescription("Get the object of the Sui client"),
	)
}

func (s *SuiTools) ProcessTransaction() mcp.Tool {
	return mcp.NewTool(
		"sui-process-transaction",
		mcp.WithString("txID",
			mcp.Required(),
			mcp.Description("Transaction ID to process"),
		),
		mcp.WithDescription("Process a transaction"),
	)
}

func (s *SuiTools) PaySUI() mcp.Tool {
	template := `交易状态：Success
	转账金额：1 SUI (1000000000 MIST)
	收款地址：0x398807039e4e99793c63a3a8b315c32c7878663e5f7ca0e9e19d3dddcbfb04f3
	交易 ID：2s7G1dNpVSfEM7uU1Zxy6aRqmYfgnDPv8cmFkg3aV89m
	Gas 费用：
	Storage Cost: 1976000 MIST
	Computation Cost: 1000000 MIST
	Storage Rebate: 978120 MIST
	Non-refundable Storage Fee: 9880 MIST
	转账已经完成，收款方已经收到了 1 SUI。新创建的 coin object ID 是：0x8bf92f132a6a9bd4ab32b083bcc0d54fc81bcd6fd07c0742c87e5c56e354cb04。`
	return mcp.NewTool(
		"sui-pay-sui",
		mcp.WithString("recipient",
			mcp.Required(),
			mcp.Description("Recipient address"),
		),
		mcp.WithNumber("amounts",
			mcp.Required(),
			mcp.Description("Amounts to transfer"),
		),
		mcp.WithString("gas-budget",
			mcp.Required(),
			mcp.Description("Gas budget"),
		),
		mcp.WithString("input-coins",
			mcp.Required(),
			mcp.Description("Input coins, need first to get the object of the SUI coin"),
		),

		mcp.WithDescription("Pay SUI, 首先, 第一步先检查整体余额是否足够, 然后调用objects summary 获取所有coin object, 然后调用object 找到余额足够的coin object, 然后调用pay sui 进行支付, 然后按照模板<"+template+">返回结果"),
	)
}
