import {_decorator, Component, Node, CCInteger, instantiate, Mesh, MeshRenderer, EventTouch, Label, Color, AudioClip} from 'cc';
import {Player} from "db://assets/Scripts/Player";
import {ReStartButton} from "db://assets/Scripts/ReStartButton";
import {TsrpcManager} from "db://assets/Scripts/TsrpcManager";
import {TipsTimeout} from "db://assets/Scripts/TipsTimeout";
import {GameInfoType} from "db://assets/Scripts/tsrpc/protocols/PtlGetGameInfo";
import {AudioManager} from "db://assets/Scripts/AudioManager";

const {ccclass, property} = _decorator;

@ccclass('SpikesManager')
export class SpikesManager extends Component {
    @property({type: Node})
    startPlatform: Node = null;
    @property({type: Node})
    spikesTemp: Node = null;
    @property({type: CCInteger})
    spikesCount: number = 20;
    @property({type: Node})
    endPlatform: Node = null;
    @property({type: Player})
    player: Player = null;
    @property({type: Mesh})
    showSpikesMesh: Mesh = null;
    @property({type: Mesh})
    hiddenSpikesMesh: Mesh = null;
    @property({type: Label})
    curPosLabel: Label = null;
    @property({type: Label})
    curPosAwardLabel: Label = null;
    @property({type: Label})
    totalPosLabel: Label = null;
    @property({type: Label})
    totalAwardLabel: Label = null;
    @property({type: ReStartButton})
    restartButton: ReStartButton = null;
    @property({type: Node})
    tips: Node = null;
    @property({type: AudioClip})
    successMusic: AudioClip = null;
    @property({type: AudioClip})
    failureMusic: AudioClip = null;

    private spikes: Node[] = [];
    private isVisibleSpikes: boolean[] = [];
    private direction: 1 | -1 = -1;
    private speed: number = 1;
    private spikesUpSpeed: number[] = [];
    private timer: number = 0;
    private killOne: number = -1;
    private oldRow: number = -1;
    private curRow: number = -1;
    private curList: number = 0;
    private lastSpikePosX: number = 0;
    private gameHashKey: string = "";

    start() {
        for (let i = 0; i < this.spikesCount; i++) {
            const spike = instantiate(this.spikesTemp);
            spike.setParent(this.node);
            spike.setPosition(i, 0, 0);
            spike.active = true;
            this.spikes.push(spike);
            this.isVisibleSpikes.push(true);
            this.spikesUpSpeed.push(0);
        }
        this.lastSpikePosX = 19;
        this.curPosLabel.string = this.curList.toString();
        this.curPosAwardLabel.string = "0";
        this.totalPosLabel.string = this.spikesCount.toString();
        this.totalAwardLabel.string = "100";
    }

    update(deltaTime: number) {
        if (this.tips.active && this.killOne !== -1) {
            if (this.killOne > -1) {
                this.tips.active = false;
                this.showSpikes();
                this.checkAlive();
            } else {
                this.tips.getComponent(TipsTimeout).delayToHide("Error to Jump");
                this.checkAlive(false);
            }
            return;
        }
        if (this.timer <= 0)
            return;
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.startPlatform.setPosition(Math.round(this.startPlatform.getPosition().x), 0, 0);
            let curLastSpikePosX = -6;
            for (let i = 0; i < 20; i++)
                if (this.isVisibleSpikes[i]) {
                    const pos = this.spikes[i].getPosition();
                    this.spikes[i].setPosition(Math.round(pos.x), 0, 0);
                    this.spikesUpSpeed[i] = 0;
                    curLastSpikePosX = Math.max(curLastSpikePosX, Math.round(pos.x));
                }
            this.lastSpikePosX = curLastSpikePosX;
            this.endPlatform.setPosition(Math.round(this.endPlatform.getPosition().x), 0, 0);
            if (this.killOne < 0 && this.direction == -1) {
                this.tips.active = true;
                return;
            }
            if (this.killOne !== -1) {
                if (this.killOne > -1) {
                    this.showSpikes();
                    this.checkAlive();
                } else {
                    this.tips.active = true;
                    this.tips.getComponent(TipsTimeout).delayToHide("Error to Jump");
                    this.checkAlive(false);
                }
            } else {
                this.hiddenSpikes();
            }
            return;
        }
        const startPlatformPos = this.startPlatform.getPosition();
        if (startPlatformPos.x > -6)
            this.startPlatform.setPosition(startPlatformPos.x + this.direction * this.speed * deltaTime, 0, 0);
        let canMoveEndPlatform = true;
        for (let i = 0; i < 20; i++)
            if (this.isVisibleSpikes[i]) {
                const pos = this.spikes[i].getPosition();
                this.spikes[i].setPosition(pos.x + this.direction * this.speed * deltaTime, pos.y + this.spikesUpSpeed[i] * deltaTime, 0);
                if (this.spikesUpSpeed[i] > 0)
                    canMoveEndPlatform = false;
            }
        this.endPlatform.setPosition(this.endPlatform.getPosition().x + this.direction * this.speed * deltaTime * (canMoveEndPlatform ? 1 : (this.direction === -1 ? 0 : 2)), 0, 0);
    }

    lateUpdate(deltaTime: number) {
        const spike = this.spikes.find(spike => spike.getPosition().y < 0);
        if (!spike)
            return;
        const spikePos = spike.getPosition();
        let targetY = spikePos.y + deltaTime * 2;
        const endPlatformPos = this.endPlatform.getPosition();
        let targetX = endPlatformPos.x + deltaTime;
        if (targetY >= 0) {
            targetY = 0;
            targetX = Math.round(targetX);
        }
        spike.setPosition(spikePos.x, targetY, 0);
        this.endPlatform.setPosition(targetX, 0, 0);
    }

    ChangeMoveDirection(direction: 1 | -1) {
        this.direction = direction;
    }

    handleClickSpike(_: EventTouch, index: number) {
        if (this.player.isJumping())
            return;
        this.ChangeMoveDirection(-1);
        this.speed = 1 / this.player.getJumpDuration();
        this.timer = this.player.getJumpDuration();
        this.curRow = index;
        this.randomKill();
    }

    randomKill() {
        const address = localStorage.getItem("address");
        const nftID = localStorage.getItem("nftID");
        TsrpcManager.instance.handleNextStep(nftID, this.gameHashKey, this.curRow, address).then(safePos => this.killOne = safePos == 0 ? 1 : (safePos == 1 ? 0 : -2));
    }

    showSpikes() {
        this.spikes.find(spike => spike.getPosition().x === -1).getChildByName(this.killOne.toString()).getChildByName("Spikes").getComponent(MeshRenderer).mesh = this.showSpikesMesh;
    }

    innerHiddenSpikes(spike: Node) {
        spike.getChildByName("0").getChildByName("Spikes").getComponent(MeshRenderer).mesh = this.hiddenSpikesMesh;
        spike.getChildByName("1").getChildByName("Spikes").getComponent(MeshRenderer).mesh = this.hiddenSpikesMesh;
    }

    hiddenSpikes() {
        this.innerHiddenSpikes(this.spikes.find(spike => spike.getPosition().x === 0));
    }

    checkAlive(asAlive: boolean = true) {
        if (asAlive && this.curRow != this.killOne) {
            this.oldRow = this.curRow;
            this.curList++;
            this.killOne = -1;
            for (let i = 0; i < 20; i++)
                if (this.isVisibleSpikes[i])
                    this.isVisibleSpikes[i] = Math.round(this.spikes[i].getPosition().x) !== -6;
            this.updateGameInfo(true);
            AudioManager.inst.playOneShot(this.successMusic, 1);
            return;
        }
        this.ChangeMoveDirection(1);
        this.speed = 1 / this.player.getJumpDuration();
        this.timer = this.player.getJumpDuration();
        this.killOne = -1;
        this.player.die(this.oldRow);
        if (asAlive)
            this.spikesCount++;
        this.scheduleOnce(() => this.updateGameInfo(false), this.timer);
        AudioManager.inst.playOneShot(this.failureMusic, 1);
    }

    moveSpikesToEnd() {
        const visibleNumber = this.calcVisibleNumber();
        if (visibleNumber > 15)
            return;
        if (visibleNumber < this.spikesCount - this.curList) {
            const idx = this.spikes.findIndex((_, index) => !this.isVisibleSpikes[index]);
            if (idx === -1)
                return;
            const spike = this.spikes[idx];
            spike.setPosition(this.lastSpikePosX + 1, -2, 0);
            this.innerHiddenSpikes(spike);
            this.isVisibleSpikes[idx] = true;
            // don't need it to move up
            // this.spikesUpSpeed[idx] = 2 / (this.timer > 0 ? this.timer : this.player.getJumpDuration());
            this.spikesUpSpeed[idx] = 0;
            this.fixEndPlatformPos(this.lastSpikePosX + 1);
        }
    }

    calcVisibleNumber() {
        let cnt = 0;
        for (let i = 0; i < 20; i++)
            cnt += this.spikes[i].getPosition().x > -1 ? 1 : 0;
        return cnt;
    }

    fixEndPlatformPos(fixedX: number) {
        this.endPlatform.setPosition(fixedX, 0, 0);
    }

    checkWin(award: number) {
        // const award = this.calcAward();
        if (this.curList !== this.spikesCount) {
            this.tips.active = true;
            this.tips.getComponent(TipsTimeout).delayToHide(award > -1 ? "Award: " + award : "Check Your Award!", Color.GREEN, 1);
            return;
        }
        this.restartButton.showReStart(award > -1 ? "Award: " + award : "Check Your Award!");
    }

    handleStart(curPos: number, curPosAward: number, totalPos: number, totalAward: number, hashKey: string) {
        const lastPos = totalPos - curPos;
        for (let i = 0; i < 20; i++) {
            const spike = this.spikes[i];
            spike.setPosition(i < lastPos ? i : -6, 0, 0);
            this.isVisibleSpikes[i] = i < lastPos;
            this.spikesUpSpeed[i] = 0;
            this.innerHiddenSpikes(spike);
        }
        this.curList = curPos;
        this.curPosLabel.string = this.curList.toString();
        this.curPosAwardLabel.string = curPosAward.toString();
        this.spikesCount = totalPos;
        this.totalPosLabel.string = this.spikesCount.toString();
        this.totalAwardLabel.string = totalAward.toString();
        this.oldRow = -1;
        this.curRow = -1;
        this.startPlatform.setPosition(-1, 0, 0);
        this.lastSpikePosX = lastPos - 1;
        this.fixEndPlatformPos(this.lastSpikePosX + 1);
        this.player.node.setPosition(-1, 0.1, 0);
        this.gameHashKey = hashKey;
    }

    rewriteInfo(info: GameInfoType) {
        const needMatchPos = Number(this.curList) != Number(info.fields.value.fields.list) || Number(this.spikesCount) != Number(info.fields.value.fields.end);
        this.curPosLabel.string = info.fields.value.fields.list.toString();
        this.curPosAwardLabel.string = info.fields.value.fields.cur_step_paid.toString();
        this.totalPosLabel.string = info.fields.value.fields.end.toString();
        this.totalAwardLabel.string = info.fields.value.fields.final_reward.toString();
        if (needMatchPos)
            this.handleNotMatchPos();
    }

    updateGameInfo(needCheckWin: boolean) {
        const address = localStorage.getItem("address");
        const nftID = localStorage.getItem("nftID");
        if (this.gameHashKey.length > 3) {
            TsrpcManager.instance.getGameInfo(address, nftID).then(ret => {
                const info = ret.find(info => info.fields.key === this.gameHashKey);
                if (!info) {
                    this.tips.active = true;
                    this.tips.getComponent(TipsTimeout).delayToHide("Please Check Your $GP", Color.GREEN, 1);
                    this.scheduleOnce(() => this.restartButton.showReStart("Game Over"), 1);
                    return;
                }
                let award = this.calcAward();
                if (Number(this.curPosLabel.string) + 1 != Number(info.fields.value.fields.list))
                    award = -1;
                this.rewriteInfo(info);
                if (needCheckWin)
                    this.checkWin(award);
                this.moveSpikesToEnd();
            });
        } else {
            TsrpcManager.instance.getEndlessGameInfo().then(info => {
                let award = this.calcAward();
                if (Number(this.curPosLabel.string) + 1 != Number(info.fields.value.fields.list))
                    award = -1;
                this.rewriteInfo(info);
                if (needCheckWin)
                    this.checkWin(award);
                this.moveSpikesToEnd();
            });
        }
    }

    calcAward() {
        const curPosAward = Number(this.curPosAwardLabel.string) + 1;
        const totalAward = Number(this.totalAwardLabel.string);
        const dx = Number(this.totalPosLabel.string) - Number(this.curPosLabel.string);
        return this.curList !== this.spikesCount ? Math.floor(curPosAward / 2) + Math.floor(totalAward / dx) : curPosAward + totalAward;
    }

    handleNotMatchPos() {
        const curPos = Number(this.curPosLabel.string);
        const totalPos = Number(this.totalPosLabel.string);
        const lastPos = totalPos - curPos;
        let i = 0, settled = 0;
        while (settled < lastPos) {
            const spike = this.spikes[i];
            const pos = spike.getPosition();
            if (pos.x > -6 && pos.x < 0) {
                i++;
                continue;
            }
            spike.setPosition(settled++, 0, 0);
            this.isVisibleSpikes[i] = true;
            this.spikesUpSpeed[i] = 0;
            this.innerHiddenSpikes(spike);
            i++;
        }
        while (i < 20) {
            const spike = this.spikes[i];
            const pos = spike.getPosition();
            if (pos.x >= -6 && pos.x < lastPos) {
                i++;
                continue;
            }
            spike.setPosition(-6, 0, 0);
            this.isVisibleSpikes[i] = false;
            this.spikesUpSpeed[i] = 0;
            this.innerHiddenSpikes(spike);
            i++;
        }
        this.curList = curPos;
        this.spikesCount = totalPos;
        this.lastSpikePosX = lastPos - 1;
        this.fixEndPlatformPos(this.lastSpikePosX + 1);
    }
}

