import {
    _decorator,
    Component,
    Material,
    Color,
    sp,
    Vec3,
    tween,
    AudioClip,
    PolygonCollider2D,
    Contact2DType,
    Collider2D,
    RigidBody2D
} from 'cc';
import {GameManager} from "db://assets/Scripts/GameManager";
import {dmgCtrl} from "db://assets/Scripts/dmgCtrl";
import {AudioManager} from "db://assets/Scripts/AudioManager";

const {ccclass, property} = _decorator;

@ccclass("colorConfig")
class colorConfig {
    @property(Color)
    color: Color = new Color();
    @property
    name = "color";
    @property
    time = 0.06;
}

@ccclass('Enemy')
export class Enemy extends Component {
    @property({type: Material})
    aliveMat: Material = null;
    @property({type: Material})
    deadMat: Material = null;
    @property({type: colorConfig})
    colors: colorConfig[] = [];
    @property({type: AudioClip})
    hitMusic: AudioClip = null;
    @property({type: AudioClip})
    dieMusic: AudioClip = null;

    private _HP: number = 5000
    private _spine: sp.Skeleton = null;
    private _time = 0;
    private _color = new Color(255, 255, 255, 255);
    private _defaultColor = new Color(255, 255, 255, 255);
    private _scale = new Vec3(0.6, 0.6, 1);
    private _targetX = 0;
    private _speed = 0;
    private _moveDir = 1;
    private _collider: PolygonCollider2D = null;
    private _rigidBody: RigidBody2D = null;
    private _canBeAttacked = true;
    private _withinRange = false;

    onLoad() {
        this._spine = this.node.getComponent(sp.Skeleton);
        this._collider = this.getComponent(PolygonCollider2D);
        this._collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this._collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        this._rigidBody = this.getComponent(RigidBody2D);
    }

    update(deltaTime: number) {
        const pos = this.node.getPosition();
        while (Math.abs(pos.x - this._targetX) < this._speed / 100)
            this.randomTargetPos();
        this._moveDir = this._targetX - pos.x > 0 ? 1 : -1;
        this.node.setPosition(pos.x + this._moveDir * this._speed * deltaTime, pos.y, pos.z);
        this.checkAttack();
    }

    onDestroy() {
        this._collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this._collider.off(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    onBeginContact(_: Collider2D, other: Collider2D) {
        if (other.tag === 111)
            this._withinRange = true;
    }

    onEndContact(_: Collider2D, other: Collider2D) {
        if (other.tag === 111)
            this._withinRange = false;
    }

    checkAttack() {
        if (this._HP <= 0 || !GameManager.instance.playerIsAttacking || !this._canBeAttacked || !this._withinRange)
            return;
        this._canBeAttacked = false;
        this.scheduleOnce(() => this._canBeAttacked = true, 1);
        const [damage, isCritical] = GameManager.instance.calcDamage();
        this.showDamage(damage, isCritical ? 1 : 0);
        this.unschedule(this.onNormal);
        const config = this.colors[Math.floor(Math.random() * this.colors.length)]
        this._time = config.time;
        this._color = config.color;
        if ((this._HP -= damage) <= 0) {
            this._speed = 0;
            this.onDeath();
            this.scheduleOnce(() => AudioManager.inst.playOneShot(this.dieMusic, 1), 1);
            this._collider.enabled = false;
            this._rigidBody.enabled = false;
            return;
        }
        this.scheduleOnce(this.onNormal, this._time);
        this.onHit();
        AudioManager.inst.playOneShot(this.hitMusic, 1);
    }

    onNormal() {
        this._spine.setAnimation(0, "run", true);
        this._spine.color = this._defaultColor;
        this._scale.x = 0.6 * this._moveDir;
        this.node.scale = this._scale;
    }

    onHit() {
        this._spine.setAnimation(0, "hit", false);
        this._spine.color = this._color;
        this._scale.x = (0.6 - 0.2 * Math.random()) * this._moveDir;
        tween(this.node).to(this._time, {scale: this._scale}).to(this._time * 0.5, {scale: this._scale}).start();
    }

    onDeath() {
        this._spine.customMaterial = this.deadMat;
        this.scheduleOnce(() => {
            this._spine.setAnimation(0, "death", false);
        });
        const color1 = {num: 255};
        const color2 = {num: 20};
        const color = this._defaultColor;
        const sp = this._spine;
        sp.color = color;
        this.scheduleOnce(() => {
            tween(color1).to(1.4, color2, {
                onUpdate(target) {
                    color.a = target.num;
                    sp.color = color;
                },
            }).call(() => {
                this._spine.loop = true;
                this._spine.animation = "run";
                this._spine.customMaterial = this.aliveMat;
                color.a = 255;
                this._spine.color = color;
                GameManager.instance.putNode(this.node);
            }).start();
        }, 1.8);
    }

    showDamage(damage: number, showType: number = 0) {
        const node = GameManager.instance.getNode();
        node.setParent(this.node.parent);
        const pos = this.node.getPosition();
        node.setPosition(pos.x - 40 + 80 * Math.random(), pos.y + 150, 0);
        node.getComponent(dmgCtrl).init(damage, showType);
    }

    randomTargetPos() {
        const pos = this.node.getPosition();
        this._targetX = Math.random() * 500 * (Math.floor(Math.random() * 2) === 0 ? -1 : 1);
        this._speed = 100 + Math.round(Math.random() * Math.min(500, 50 * (GameManager.instance.curLevel - 1)));
        this._moveDir = this._targetX - pos.x > 0 ? 1 : -1;
        this._scale.x = this._moveDir === 1 ? 0.6 : -0.6;
        this.node.scale = this._scale;
    }

    init(hp: number) {
        this._HP = hp;
        if (this._collider)
            this._collider.enabled = true;
        if (this._rigidBody)
            this._rigidBody.enabled = true;
        this._canBeAttacked = true;
        this._withinRange = false;
        this.randomTargetPos();
    }
}

