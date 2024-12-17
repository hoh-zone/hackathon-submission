package achievement

import (
	"context"
	"github.com/block-vision/sui-go-sdk/models"
	"github.com/block-vision/sui-go-sdk/sui"
	"testing"
)

func TestAchievementService_CreateAchievement(t *testing.T) {
	cli := sui.NewSuiClient("https://sui-mainnet-endpoint.blockvision.org")
	rsp, err := cli.SuiGetTransactionBlock(context.Background(), models.SuiGetTransactionBlockRequest{
		Digest: "CJVr7R71PZypFbwtEB4jMbbsv33EDDbM1njLCvh7ssNe",
		// only fetch the effects field
		Options: models.SuiTransactionBlockOptions{
			ShowInput:          true,
			ShowRawInput:       true,
			ShowEffects:        true,
			ShowEvents:         true,
			ShowBalanceChanges: true,
			ShowObjectChanges:  true,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	for _, change := range rsp.ObjectChanges {
		t.Log("objchange", change)
	}
	t.Log(rsp)
}
