import {_decorator, Component, Label, Color} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('TipsTimeout')
export class TipsTimeout extends Component {
    @property({type: Label})
    label: Label = null;

    delayToHide(msg: string, color: Color = Color.RED, delay: number = 2) {
        this.label.string = msg;
        this.label.color = color;
        this.scheduleOnce(() => {
            this.label.string = "Waiting...";
            Color.fromHEX(this.label.color, "196AE3");
            this.node.active = false;
        }, delay)
    }
}

