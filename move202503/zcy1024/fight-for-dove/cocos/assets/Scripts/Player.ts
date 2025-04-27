import {
    _decorator,
    Component,
    Animation,
    input,
    Input,
    EventKeyboard,
    KeyCode,
    Vec3,
    AudioClip,
    PolygonCollider2D,
    Contact2DType,
    Collider2D,
    Sprite,
    Color,
    RigidBody2D,
    Vec2
} from 'cc';
import {AudioManager} from "db://assets/Scripts/AudioManager";
import {GameManager, PlayerInfoType} from "db://assets/Scripts/GameManager";

const {ccclass, property} = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property({type: Animation})
    anim: Animation = null;
    @property({type: AudioClip})
    attackMusic: AudioClip = null;
    @property({type: PolygonCollider2D})
    collider: PolygonCollider2D = null;
    @property({type: Sprite})
    sprite: Sprite = null;
    @property({type: AudioClip})
    dieMusic: AudioClip = null;
    @property({type: RigidBody2D})
    rigidBody: RigidBody2D = null;

    private _hp = 5;
    private _moveDir = 1;
    private _speed = 0;
    private _attackTimer = 0;
    private _isRunning = false;
    private _jumpCount = 2;
    private _playerInfo: PlayerInfoType = null;

    onLoad() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        this.collider.on(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }

    start() {
        this.init();
    }

    update(deltaTime: number) {
        if (this._hp <= 0)
            return;
        if (this._attackTimer > 0) {
            this._attackTimer -= deltaTime;
            if (this._attackTimer > 0.2)
                return;
        }
        const pos = this.node.getPosition();
        let destX = pos.x + this._moveDir * this._speed * deltaTime;
        destX = Math.min(destX, 600);
        destX = Math.max(destX, -600);
        this.node.setPosition(destX, pos.y, 0);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        this.collider.off(Contact2DType.BEGIN_CONTACT, this.onHit, this);
    }

    onKeyDown(event: EventKeyboard) {
        if (this._hp <= 0)
            return;
        if (event.keyCode === KeyCode.KEY_K && this._jumpCount > 0) {
            this._jumpCount--;
            this.anim.play("PlayerJump");
            this.rigidBody.linearVelocity = new Vec2(0, 15);
            return;
        }
        if (event.keyCode === KeyCode.KEY_J && this._attackTimer <= 0) {
            this._attackTimer = 0.8;
            this.anim.play("PlayerAttack");
            GameManager.instance.playerIsAttacking = true;
            this.scheduleOnce(() => {
                this.anim.play(this._isRunning ? "PlayerRun" : "PlayerIdle");
                GameManager.instance.playerIsAttacking = false;
            }, 0.6);
            this.scheduleOnce(() => AudioManager.inst.playOneShot(this.attackMusic, 1), 0.3);
            return;
        }
        if (event.keyCode !== KeyCode.KEY_A && event.keyCode !== KeyCode.KEY_D)
            return;
        this._moveDir = event.keyCode === KeyCode.KEY_A ? -1 : 1;
        this.node.scale = new Vec3(this._moveDir, 1, 1);
        this._speed = this._playerInfo.moveSpeed;
        if (this.canPlayNow())
            this.anim.play("PlayerRun");
        this._isRunning = true;
    }

    onKeyUp(event: EventKeyboard) {
        if (this._hp <= 0)
            return;
        if (event.keyCode !== KeyCode.KEY_A && event.keyCode !== KeyCode.KEY_D)
            return;
        this._speed = 0;
        if (this.canPlayNow())
            this.anim.play("PlayerIdle");
        this._isRunning = false;
    }

    onHit(self: Collider2D, other: Collider2D) {
        if (other.node.name === "Down") {
            this._jumpCount = 2;
            const state = this.anim.getState("PlayerJump");
            if (state.isPlaying)
                this.anim.play(this._isRunning ? "PlayerRun" : "PlayerIdle");
        }
        if (other.node.name !== "EnemyPrefab" || this._hp <= 0)
            return;
        AudioManager.inst.playOneShot(this.dieMusic, 1);
        self.group = 1;
        if (--this._hp <= 0) {
            this.anim.play("PlayerDie");
            GameManager.instance.gameOver();
            return;
        }
        this.scheduleOnce(() => self.group = 2, 1);
        this.schedule(() => {
            const a = this.sprite.color.a === 255 ? 0 : 255;
            this.sprite.color = new Color(255, 255, 255, a);
        }, 0.1, 9);
    }

    canPlayNow() {
        return this._attackTimer <= 0;
    }

    init() {
        this._playerInfo = GameManager.instance.trulyPlayerInfo;
        this._hp = this._playerInfo.hp;
    }
}

