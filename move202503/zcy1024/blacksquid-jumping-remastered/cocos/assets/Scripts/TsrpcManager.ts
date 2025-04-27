import {HttpClient} from "tsrpc-browser";
import {serviceProto, ServiceType} from "db://assets/Scripts/tsrpc/protocols/serviceProto";

export class TsrpcManager {
    private static _instance: TsrpcManager;
    private _apiClient: HttpClient<ServiceType>;

    public static get instance() {
        if (!this._instance) {
            this._instance = new TsrpcManager();
            this._instance._apiClient = new HttpClient(serviceProto, {
                server: "http://47.98.228.198:7457",
                json: true
            });
        }
        return this._instance;
    }

    async login(username: string, password: string, address: string) {
        const res = await this._apiClient.callApi("Login", {
            username,
            password,
            address
        });
        return res.res.state === "success";
    }

    async getNFTID(address: string) {
        return (await this._apiClient.callApi("GetNFT", {
            address
        })).res.nftID;
    }

    async getGameInfo(address: string, nftID: string) {
        return (await this._apiClient.callApi("GetGameInfo", {
            address,
            nftID
        })).res.gameInfo;
    }

    async getEndlessGameInfo() {
        return (await this._apiClient.callApi("GetEndlessGameInfo", {})).res.endlessGameInfo;
    }

    async handleNextStep(nftID: string, hashKey: string, userPos: number, receipt: string) {
        const res = (await this._apiClient.callApi("NextStep", {
            nftID,
            hashKey,
            userPos: userPos.toString(),
            receipt
        }));
        if (!res.isSucc)
            return -2;
        return res.res.safePos;
    }
}

