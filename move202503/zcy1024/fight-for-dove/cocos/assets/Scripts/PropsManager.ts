import {_decorator, Component, Prefab, UITransform, math} from 'cc';
import {PropsType} from "db://assets/Scripts/tsrpc/protocols/PtlGetGameInfo";
import {GameManager} from "db://assets/Scripts/GameManager";
import {SingleProps} from "db://assets/Scripts/SingleProps";

const {ccclass, property} = _decorator;

@ccclass('PropsManager')
export class PropsManager extends Component {
    @property({type: Prefab})
    singlePropsPrefab: Prefab = null;

    private _uiTransform: UITransform = null;

    onLoad() {
        this._uiTransform = this.getComponent(UITransform);
    }

    clearNodes() {
        while (true) {
            const node = this.node.getChildByName("SingleProps");
            if (!node)
                return;
            GameManager.instance.putNode(node);
        }
    }

    init(props: PropsType[]) {
        this.clearNodes();
        props.sort((a, b) => a.fields.id.id < b.fields.id.id ? -1 : 1);
        const size = this._uiTransform.contentSize;
        this._uiTransform.setContentSize(math.size(110 * props.length, size.y));
        for (let i = 0; i < props.length; i++) {
            const node = GameManager.instance.getNode(this.singlePropsPrefab);
            node.setParent(this.node);
            node.getComponent(SingleProps).init(props[i], 110 * i);
        }
    }
}

