import {_decorator, Component, LabelComponent, Font, AnimationComponent} from "cc";
import {GameManager} from "db://assets/Scripts/GameManager";

const {ccclass, property} = _decorator;

@ccclass("dmgCtrl")
export class dmgCtrl extends Component {

    @property(AnimationComponent)
    anim: AnimationComponent = null;
    @property(LabelComponent)
    text: LabelComponent = null;
    @property({type: Font})
    fonts: Font[] = [];

    init(dmg: number, index = 0) {
        this.text.font = this.fonts[index];
        this.text.fontSize = 56 + 16 * Math.random();
        this.text.string = "-" + dmg;
        this.anim.play();
        this.scheduleOnce(this.recycleSelf, 0.97);
    }

    recycleSelf() {
        this.anim.stop()
        this.text.node.setPosition(0, 20)
        this.text.string = null;
        GameManager.instance.putNode(this.node);
    }
}