import {HttpClient} from "tsrpc-browser";
import {serviceProto, ServiceType} from "db://assets/Scripts/tsrpc/protocols/serviceProto";

export class TsrpcManager {
    private static _instance: TsrpcManager;
    private _apiClient: HttpClient<ServiceType>;

    public static get instance() {
        if (!this._instance) {
            this._instance = new TsrpcManager();
            this._instance._apiClient = new HttpClient(serviceProto, {
                server: "http://47.98.228.198:7459",
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

    async getGameInfo(user: string | null | undefined) {
        return (await this._apiClient.callApi("GetGameInfo", {
            user
        })).res.info;
    }

    async newGame(user: string) {
        return (await this._apiClient.callApi("NewGame", {
            user
        })).res.success;
    }

    async nextLevel(user: string) {
        return (await this._apiClient.callApi("NextLevel", {
            user
        })).res.success;
    }

    async endGame(user: string) {
        return (await this._apiClient.callApi("EndGame", {
            user
        })).res.success;
    }

    async dropAll(user: string) {
        return (await this._apiClient.callApi("DropAll", {
            user
        })).res.success;
    }

    async generateProps(user: string) {
        return (await this._apiClient.callApi("GenerateProps", {
            user
        })).res.success;
    }

    async getOwnedProps(owner: string) {
        return (await this._apiClient.callApi("GetOwnedProps", {
            owner
        })).res.props;
    }
}
