import { _decorator, Component, Label } from 'cc';
import {PlayerInfoType} from "db://assets/Scripts/GameManager";

const { ccclass, property } = _decorator;

@ccclass('PlayerInfo')
export class PlayerInfo extends Component {
    @property({type: Label})
    hp: Label = null;
    @property({type: Label})
    attack: Label = null;
    @property({type: Label})
    criticalHitRate: Label = null;
    @property({type: Label})
    criticalDamage: Label = null;
    @property({type: Label})
    moveSpeed: Label = null;

    showInfo(info: PlayerInfoType) {
        this.hp.string = info.hp.toFixed(0);
        this.attack.string = info.attack.toFixed(0);
        this.criticalHitRate.string = (info.criticalHitRate * 100).toFixed(0) + "%";
        this.criticalDamage.string = (info.criticalDamage * 100).toFixed(0) + "%";
        this.moveSpeed.string = info.moveSpeed.toFixed(0);
    }
}

