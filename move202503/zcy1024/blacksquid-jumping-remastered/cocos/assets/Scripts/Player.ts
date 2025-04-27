import {_decorator, Component, Animation, AnimationState, EventTouch} from 'cc';

const {ccclass, property} = _decorator;

const JumpZList: [number, number] = [-0.5, 0.5];

@ccclass('Player')
export class Player extends Component {
    @property({type: Animation})
    jump: Animation = null;

    private jumpState: AnimationState = null;
    private targetZ: number = 0;
    private speed: number = 0;

    start() {
        this.jumpState = this.jump.getState("SlimeJump");
    }

    update(deltaTime: number) {
        if (!this.isJumping())
            return;
        const pos = this.node.getPosition();
        const d1 = Math.abs(this.targetZ - pos.z);
        if (d1 < 1e-6)
            return;
        const nextZ = pos.z + this.speed * deltaTime;
        const d2 = Math.abs(this.targetZ - nextZ);
        this.node.setPosition(pos.x, pos.y, d1 > d2 ? nextZ : this.targetZ);
    }

    isJumping() {
        return this.jumpState.isPlaying;
    }

    getJumpDuration() {
        return this.jumpState.duration;
    }

    handleClickSpike(_: EventTouch, index: number) {
        if (this.isJumping())
            return;
        this.jump.play();
        this.targetZ = JumpZList[index];
        this.speed = (this.targetZ - this.node.getPosition().z) / this.getJumpDuration();
    }

    die(oldIndex: number) {
        this.jump.play();
        this.targetZ = oldIndex === -1 ? 0 : JumpZList[oldIndex];
        this.speed = (this.targetZ - this.node.getPosition().z) / this.getJumpDuration();
    }
}

