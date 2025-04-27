import {_decorator, Component, Node, NodePool, Prefab, instantiate, AudioClip, Label} from 'cc';
import {AudioManager} from "db://assets/Scripts/AudioManager";
import {EnemyManager} from "db://assets/Scripts/EnemyManager";
import {PropsType, UserInfoType} from "db://assets/Scripts/tsrpc/protocols/PtlGetGameInfo";
import {TsrpcManager} from "db://assets/Scripts/TsrpcManager";
import {PropsManager} from "db://assets/Scripts/PropsManager";
import {PlayerInfo} from "db://assets/Scripts/PlayerInfo";
import {Player} from "db://assets/Scripts/Player";

const {ccclass, property} = _decorator;

export type PlayerInfoType = {
    hp: number,
    attack: number,
    criticalHitRate: number,
    criticalDamage: number,
    moveSpeed: number
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property({type: Prefab})
    dmgTextPrefab: Prefab = null;
    @property({type: AudioClip})
    bgMusic: AudioClip = null;

    // ------ Instance ------
    private static _instance: GameManager = null;
    static get instance() {
        return this._instance;
    }

    start() {
        GameManager._instance = this;
        AudioManager.inst.play(this.bgMusic, true, 0.3);
    }

    // ------ NodePool ------
    private _nodePool: {
        [key: string]: NodePool
    } = {};

    getPool(name: string) {
        if (!this._nodePool.hasOwnProperty(name))
            this._nodePool[name] = new NodePool();
        return this._nodePool[name];
    }

    getNode(prefab: Prefab = this.dmgTextPrefab) {
        const pool = this.getPool(prefab.name);
        return pool.size() > 0 ? pool.get() : instantiate(prefab);
    }

    putNode(node: Node) {
        if (!node)
            return;
        const pool = this.getPool(node.name);
        pool.put(node);
    }

    // ------ Player ------
    @property({type: Player})
    player: Player = null;

    private _playerIsAttacking = false;
    private _basicPlayerInfo: PlayerInfoType = {
        hp: 6,
        attack: 3333,
        criticalHitRate: 0.03,
        criticalDamage: 1.2,
        moveSpeed: 250
    }
    private _trulyPlayerInfo: PlayerInfoType = {
        hp: 6,
        attack: 3333,
        criticalHitRate: 0.03,
        criticalDamage: 1.2,
        moveSpeed: 250
    }

    set playerIsAttacking(isAttacking: boolean) {
        this._playerIsAttacking = isAttacking;
    }

    get playerIsAttacking() {
        return this._playerIsAttacking;
    }

    get trulyPlayerInfo() {
        return this._trulyPlayerInfo;
    }

    // ------ UI ------
    @property({type: Node})
    startUI: Node = null;
    @property({type: Node})
    inGameUI: Node = null;
    @property({type: Node})
    endUI: Node = null;
    @property({type: Node})
    enemyManager: Node = null;
    @property({type: Node})
    waitingUI: Node = null;
    @property({type: Node})
    errorUI: Node = null;

    async handleClickStartGame() {
        if (this._curLevel === 1) {
            this.waitingUI.active = true;
            const info = await TsrpcManager.instance.getGameInfo(localStorage.getItem("address"));
            GameManager.instance.refreshGameInfo(info);
        }
        if (this._newGameCount < 1 && this._curLevel === 1) {
            GameManager.instance.showError();
            return;
        }
        this.waitingUI.active = true;
        if (this._curLevel === 1) {
            TsrpcManager.instance.newGame(localStorage.getItem("address")).then(success => {
                if (!success) {
                    this.waitingUI.active = false;
                    GameManager.instance.showError();
                    return;
                }
                this.enterGame();
            });
        } else if (this._curLevel > 0) {
            TsrpcManager.instance.nextLevel(localStorage.getItem("address")).then(success => {
                if (!success) {
                    this.waitingUI.active = false;
                    GameManager.instance.showError();
                    return;
                }
                this.enterGame();
            });
        } else {
            this._equippedIds = [];
            this.calcPlayerInfo([]);
            TsrpcManager.instance.getGameInfo(localStorage.getItem("address")).then(info => {
                if (info.fields.value.fields.game_state === "Ready") {
                    GameManager.instance.refreshGameInfo(info);
                    return;
                }
                TsrpcManager.instance.dropAll(localStorage.getItem("address")).then(success => {
                    if (!success) {
                        this.waitingUI.active = false;
                        GameManager.instance.showError();
                        return;
                    }
                    TsrpcManager.instance.getGameInfo(localStorage.getItem("address")).then(info => {
                        GameManager.instance.refreshGameInfo(info);
                    });
                });
            });
        }
    }

    enterGame() {
        this.player.init();
        this.showUI(-1);
        this.enemyManager.active = true;
        this.enemyManager.getComponent(EnemyManager).clearAllNodes();
        this._gameTimer = this._curLevel <= 3 ? 30 : (this._curLevel <= 10 ? 60 : 90);
        this._gameOver = false;
    }

    showUI(idx: number) {
        this.startUI.active = idx === 0;
        this.inGameUI.active = idx === 1;
        this.endUI.active = idx === 2;
        this.waitingUI.active = false;
    }

    showError(msg: string = "Error...") {
        this.errorUI.active = true;
        this.errorUI.getComponent(Label).string = msg;
        this.scheduleOnce(() => this.errorUI.active = false, 3);
    }

    // ------ game info ------
    @property({type: PropsManager})
    inGamePropsManager: PropsManager = null;
    @property({type: PropsManager})
    ordinaryPropsManager: PropsManager[] = [];
    @property({type: PropsManager})
    excellentPropsManager: PropsManager[] = [];
    @property({type: PropsManager})
    epicPropsManager: PropsManager[] = [];
    @property({type: PlayerInfo})
    playerInfoManager: PlayerInfo[] = [];
    @property({type: PlayerInfo})
    updatePlayerInfoManager: PlayerInfo[] = [];

    private _curLevel = 0;
    get curLevel() {
        return this._curLevel;
    }
    private _newGameCount = 0;
    private _newProps: PropsType[] = [];
    private _inGameProps: PropsType[] = [];
    private _ownedProps: PropsType[] = [];
    private _canEquippedCount = 5;
    private _equippedIds: string[] = [];

    refreshGameInfo(info: UserInfoType) {
        this._curLevel = info.fields.value.fields.game_state === "Ready" ? 1 : (info.fields.value.fields.game_state === "End" ? -1 : info.fields.value.fields.game_state.length + 1);
        this._newGameCount = Number(info.fields.value.fields.can_new_game_amount);
        this.showUI(info.fields.value.fields.game_state === "Ready" ? 0 : (info.fields.value.fields.game_state === "End" ? 2 : 1));
        if (this.inGameUI.active)
            this.inGamePropsManager.init(info.fields.value.fields.in_game_props);
        this._inGameProps = info.fields.value.fields.in_game_props;
        this.refreshOwnedProps();
        this._trulyPlayerInfo = this.calcPlayerInfo(this._equippedIds);
        this.showPlayerInfo(this._trulyPlayerInfo, true);
    }

    refreshOwnedProps() {
        TsrpcManager.instance.getOwnedProps(localStorage.getItem("address")).then(infos => {
            const ordinaryProps: PropsType[] = [];
            const excellentProps: PropsType[] = [];
            const epicProps: PropsType[] = [];
            infos.forEach(info => {
                const quality = info.fields.quality;
                if (quality === "ordinary")
                    ordinaryProps.push(info);
                else if (quality === "excellent")
                    excellentProps.push(info);
                else
                    epicProps.push(info);
            });
            this.ordinaryPropsManager.forEach((manager, index) => {
                if (index === 0 && this.startUI.active || index === 1 && this.inGameUI.active)
                    manager.init(ordinaryProps);
            });
            this.excellentPropsManager.forEach((manager, index) => {
                if (index === 0 && this.startUI.active || index === 1 && this.inGameUI.active)
                    manager.init(excellentProps);
            });
            this.epicPropsManager.forEach((manager, index) => {
                if (index === 0 && this.startUI.active || index === 1 && this.inGameUI.active)
                    manager.init(epicProps);
            });
            this._ownedProps = infos;
        })
    }

    checkIfEquipMore() {
        return this._equippedIds.length < this._canEquippedCount;
    }

    checkIfEquipped(id: string): boolean {
        return this._equippedIds.find(equippedId => equippedId === id) !== undefined;
    }

    editEquippedIds(id: string, isAdd: boolean) {
        if (isAdd)
            this._equippedIds.push(id);
        else
            this._equippedIds = this._equippedIds.filter(equippedId => equippedId !== id);
        this._trulyPlayerInfo = this.calcPlayerInfo(this._equippedIds);
        this.showPlayerInfo(this._trulyPlayerInfo, true);
    }

    calcPlayerInfo(equippedIds: string[]) {
        const playerInfo: PlayerInfoType = {
            hp: this._basicPlayerInfo.hp,
            attack: this._basicPlayerInfo.attack,
            criticalHitRate: this._basicPlayerInfo.criticalHitRate,
            criticalDamage: this._basicPlayerInfo.criticalDamage,
            moveSpeed: this._basicPlayerInfo.moveSpeed
        };
        equippedIds.forEach(id => {
            let props = this._ownedProps.find(props => props.fields.id.id === id);
            if (!props)
                props = this._inGameProps.find(props => props.fields.id.id === id);
            if (!props)
                props = this._newProps.find(props => props.fields.id.id === id);
            props.fields.effects.fields.contents.forEach(effect => {
                const key = effect.fields.key;
                const value = Number(effect.fields.value) - 1000;
                const ratio = 1 + value / 100;
                if (key === "blood") {
                    playerInfo.hp += value;
                } else if (key === "attack") {
                    playerInfo.attack = playerInfo.attack * ratio;
                } else if (key === "criticalHitRate") {
                    playerInfo.criticalHitRate = playerInfo.criticalHitRate * ratio;
                } else if (key === "criticalDamage") {
                    playerInfo.criticalDamage = playerInfo.criticalDamage * ratio;
                } else if (key === "moveSpeed") {
                    playerInfo.moveSpeed = playerInfo.moveSpeed * ratio;
                }
            })
        });
        playerInfo.hp = Math.max(1, playerInfo.hp);
        playerInfo.attack = Math.max(0, Math.round(playerInfo.attack));
        playerInfo.criticalHitRate = Math.max(0, Number(playerInfo.criticalHitRate.toFixed(2)));
        playerInfo.criticalDamage = Math.max(1, Number(playerInfo.criticalDamage.toFixed(2)));
        playerInfo.moveSpeed = Math.max(100, Math.round(playerInfo.moveSpeed));
        return playerInfo;
    }

    calcFakePlayerInfo(id: string, isMoveIn: boolean) {
        if (!isMoveIn) {
            this.showPlayerInfo(this._trulyPlayerInfo, false);
            return;
        }
        const found = this._equippedIds.find(equippedId => equippedId === id);
        const fakePlayerInfo = this.calcPlayerInfo(found ? this._equippedIds.filter(equippedId => equippedId !== id) : this._equippedIds.concat(id));
        this.showPlayerInfo(fakePlayerInfo, false);
    }

    showPlayerInfo(info: PlayerInfoType, isTruly: boolean) {
        const idx = this.startUI.active ? 0 : (this.inGameUI.active ? 1 : -1);
        if (idx === -1)
            return;
        if (isTruly)
            this.playerInfoManager[idx].showInfo(info);
        else
            this.updatePlayerInfoManager[idx].showInfo(info);
    }

    calcDamage(): [number, boolean] {
        const damage = this._trulyPlayerInfo.attack;
        if (Math.random() <= this._trulyPlayerInfo.criticalHitRate)
            return [Math.round(damage * this._trulyPlayerInfo.criticalDamage), true];
        return [damage, false];
    }

    private _gameTimer = 0;
    get gameTimer() {
        return this._gameTimer;
    }

    private _gameOver = false;

    @property({type: Label})
    timeLabel: Label = null;

    gameOver() {
        this._gameOver = true;
        this.endUI.active = true;
        this.enemyManager.active = false;
        this.waitingUI.active = true;
        TsrpcManager.instance.endGame(localStorage.getItem("address")).then(success => {
            if (!success) {
                this.errorUI.active = true;
                return;
            }
            TsrpcManager.instance.getGameInfo(localStorage.getItem("address")).then(info => {
                GameManager.instance.refreshGameInfo(info);
            })
        })
    }

    update(deltaTime: number) {
        if (this._gameOver || this._gameTimer <= 0)
            return;
        this._gameTimer -= deltaTime;
        this.timeLabel.string = this._gameTimer.toFixed(2);
        if (this._gameTimer <= 0) {
            this.timeLabel.string = "0";
            this.inGameUI.active = true;
            this.enemyManager.active = false;
            this.waitingUI.active = true;
            TsrpcManager.instance.generateProps(localStorage.getItem("address")).then(success => {
                if (!success) {
                    this.waitingUI.active = false;
                    this.errorUI.active = true;
                    return;
                }
                TsrpcManager.instance.getGameInfo(localStorage.getItem("address")).then(info => {
                    GameManager.instance.refreshGameInfo(info);
                });
            });
        }
    }
}

