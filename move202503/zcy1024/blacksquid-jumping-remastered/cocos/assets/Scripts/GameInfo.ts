import {_decorator, Component, Label} from 'cc';
import {GameInfoType} from "db://assets/Scripts/tsrpc/protocols/PtlGetGameInfo";

const {ccclass, property} = _decorator;

@ccclass('GameInfo')
export class GameInfo extends Component {
    @property({type: Label})
    curPos: Label = null;
    @property({type: Label})
    curPosAward: Label = null;
    @property({type: Label})
    totalPos: Label = null;
    @property({type: Label})
    totalAward: Label = null;

    private _info: GameInfoType = null;

    updateLabel(info: GameInfoType | null) {
        this._info = info;
        if (!info) {
            this.curPos.string = "CurPos: ???";
            this.curPosAward.string = "CurPosAward: ???";
            this.totalPos.string = "TotalPos: ???";
            this.totalAward.string = "TotalAward: ???";
            return;
        }
        this.curPos.string = "CurPos: " + info.fields.value.fields.list;
        this.curPosAward.string = "CurPosAward: " + info.fields.value.fields.cur_step_paid;
        this.totalPos.string = "TotalPos: " + info.fields.value.fields.end;
        this.totalAward.string = "TotalAward: " + info.fields.value.fields.final_reward;
    }

    get info() {
        return this._info;
    }
}

