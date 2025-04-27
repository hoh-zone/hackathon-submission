import {_decorator, Component, Node, Label} from 'cc';

const {ccclass, property} = _decorator;

@ccclass('ReStartButton')
export class ReStartButton extends Component {
    @property({type: Node})
    awardNode: Node = null;
    @property({type: Label})
    buttonLabel: Label = null;

    showReStart(label: number | string) {
        this.awardNode.getComponent(Label).string = label.toString();
        this.awardNode.active = true;
        this.buttonLabel.string = "Restart";
        this.node.active = true;
        this.node.parent.active = true;
    }
}

