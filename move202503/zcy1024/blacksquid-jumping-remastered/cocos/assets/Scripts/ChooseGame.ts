import {_decorator, Component, EventTouch} from 'cc';
import {GameInfo} from "db://assets/Scripts/GameInfo";
import {GameInfoType} from "db://assets/Scripts/tsrpc/protocols/PtlGetGameInfo";
import {SpikesManager} from "db://assets/Scripts/SpikesManager";

const {ccclass, property} = _decorator;

@ccclass('ChooseGame')
export class ChooseGame extends Component {
    @property({type: GameInfo})
    endLess: GameInfo = null;
    @property({type: GameInfo})
    game1: GameInfo = null;
    @property({type: GameInfo})
    game2: GameInfo = null;
    @property({type: SpikesManager})
    spikesManager: SpikesManager = null;

    handleStartGame(_: EventTouch, idx: number) {
        if (idx == -1 && !this.endLess.info || idx == 0 && !this.game1.info || idx == 1 && !this.game2.info)
            return;
        const info = idx == -1 ? this.endLess.info : (idx == 0 ? this.game1.info : this.game2.info);
        this.spikesManager.handleStart(
            Number(info.fields.value.fields.list),
            Number(info.fields.value.fields.cur_step_paid),
            Number(info.fields.value.fields.end),
            Number(info.fields.value.fields.final_reward),
            info.fields.key);
        this.node.active = false;
        this.node.parent.active = false;
    }

    updateGameInfo(info: GameInfoType[]) {
        const len = info.length;
        this.game1.updateLabel(len > 0 ? info[0] : null);
        this.game2.updateLabel(len > 1 ? info[1] : null);
    }

    updateEndlessGameInfo(info: GameInfoType) {
        this.endLess.updateLabel(info);
    }
}

