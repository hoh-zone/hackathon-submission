import {_decorator, Component, EditBox, Label} from 'cc';
import {TsrpcManager} from "db://assets/Scripts/TsrpcManager";
import {GameManager} from "db://assets/Scripts/GameManager";

const {ccclass, property} = _decorator;

@ccclass('Login')
export class Login extends Component {
    @property({type: EditBox})
    username: EditBox = null;
    @property({type: EditBox})
    password: EditBox = null;
    @property({type: EditBox})
    address: EditBox = null;
    @property({type: Label})
    confirmLabel: Label = null;

    onLoad() {
        this.readInfo();
    }

    readInfo() {
        const username = localStorage.getItem("username");
        const password = localStorage.getItem("password");
        const address = localStorage.getItem("address");
        if (!username || !password || !address)
            return;
        this.username.string = username;
        this.password.string = password;
        this.address.string = address;
    }

    writeInfo() {
        localStorage.setItem("username", this.username.string);
        localStorage.setItem("password", this.password.string);
        localStorage.setItem("address", this.address.string);
    }

    handleClickConfirm() {
        const username = this.username.string;
        const password = this.password.string;
        const address = this.address.string;
        if (!username || !password || !address || this.confirmLabel.string === "...")
            return;
        this.confirmLabel.string = "...";
        TsrpcManager.instance.login(username, password, address).then(ok => {
            if (!ok) {
                GameManager.instance.showError();
                this.confirmLabel.string = "Confirm";
                return;
            }
            this.writeInfo();
            TsrpcManager.instance.getGameInfo(address).then(info => {
                GameManager.instance.refreshGameInfo(info);
                this.confirmLabel.string = "Confirm";
                this.node.active = false;
            })
        })
    }
}

