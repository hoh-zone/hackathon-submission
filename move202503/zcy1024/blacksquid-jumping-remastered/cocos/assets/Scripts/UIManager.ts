import {_decorator, Component, Node, EditBox, Label, AudioClip} from 'cc';
import {SpikesManager} from "db://assets/Scripts/SpikesManager";
import {TsrpcManager} from "db://assets/Scripts/TsrpcManager";
import {ChooseGame} from "db://assets/Scripts/ChooseGame";
import {AudioManager} from "db://assets/Scripts/AudioManager";

const {ccclass, property} = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property({type: Node})
    login: Node = null;
    @property({type: Node})
    startButton: Node = null;
    @property({type: Node})
    chooseGame: Node = null;
    @property({type: SpikesManager})
    spikesManager: SpikesManager = null;
    @property({type: EditBox})
    usernameEditBox: EditBox = null;
    @property({type: EditBox})
    passwordEditBox: EditBox = null;
    @property({type: EditBox})
    addressEditBox: EditBox = null;
    @property({type: Label})
    confirmLabel: Label = null;
    @property({type: AudioClip})
    gameBg: AudioClip = null;

    start() {
        AudioManager.inst.play(this.gameBg, true, 0.3);
        this.readStorage();
    }

    handleClickLogin() {
        this.confirmLabel.string = "Waiting...";
        TsrpcManager.instance.login(this.usernameEditBox.string, this.passwordEditBox.string, this.addressEditBox.string).then(ok => {
            if (ok) {
                this.login.active = false;
                this.startButton.active = true;
                this.writeStorage();
            }
            this.confirmLabel.string = "Confirm";
        });
    }

    handleClickStart() {
        this.startButton.active = false;
        this.chooseGame.active = true;
        this.spikesManager.handleStart(0, 1, 21, 2, "");
        this.refreshGameInfo();
    }

    readStorage() {
        const username = localStorage.getItem("username");
        const password = localStorage.getItem("password");
        const address = localStorage.getItem("address");
        this.usernameEditBox.string = username ? username : "";
        this.passwordEditBox.string = password ? password : "";
        this.addressEditBox.string = address ? address : "";
    }

    writeStorage() {
        const address = this.addressEditBox.string;
        localStorage.setItem("username", this.usernameEditBox.string);
        localStorage.setItem("password", this.passwordEditBox.string);
        localStorage.setItem("address", address);
        TsrpcManager.instance.getNFTID(address).then(nftID => {
            localStorage.setItem("nftID", nftID);
            TsrpcManager.instance.getGameInfo(address, nftID).then(info => this.chooseGame.getComponent(ChooseGame).updateGameInfo(info));
            TsrpcManager.instance.getEndlessGameInfo().then(info => this.chooseGame.getComponent(ChooseGame).updateEndlessGameInfo(info));
        });
    }

    refreshGameInfo() {
        const address = localStorage.getItem("address");
        const nftID = localStorage.getItem("nftID");
        if (!nftID) {
            TsrpcManager.instance.getNFTID(address).then(nftID => {
                if (!nftID)
                    return;
                localStorage.setItem("nftID", nftID);
                TsrpcManager.instance.getGameInfo(address, nftID).then(info => this.chooseGame.getComponent(ChooseGame).updateGameInfo(info));
                TsrpcManager.instance.getEndlessGameInfo().then(info => this.chooseGame.getComponent(ChooseGame).updateEndlessGameInfo(info));
            });
            return;
        }
        TsrpcManager.instance.getGameInfo(address, nftID).then(info => this.chooseGame.getComponent(ChooseGame).updateGameInfo(info));
        TsrpcManager.instance.getEndlessGameInfo().then(info => this.chooseGame.getComponent(ChooseGame).updateEndlessGameInfo(info));
    }

    handleBackToChooseGame() {
        this.chooseGame.active = true;
        this.chooseGame.parent.active = true;
        this.refreshGameInfo();
    }
}

