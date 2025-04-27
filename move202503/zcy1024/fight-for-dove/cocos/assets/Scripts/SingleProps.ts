import {_decorator, Component, Sprite, Widget, Node, SpriteFrame} from 'cc';
import {PropsType} from "db://assets/Scripts/tsrpc/protocols/PtlGetGameInfo";
import {GameManager} from "db://assets/Scripts/GameManager";

const {ccclass, property} = _decorator;

@ccclass('SingleProps')
export class SingleProps extends Component {
    @property({type: SpriteFrame})
    frames: SpriteFrame[] = [];

    private _propsID = "";
    private _propsType = "";
    private _quality = "";
    private _imageURL = "";
    private _effects: {
        key: string,
        value: string
    }[] = [];
    private _isChosen = false;
    private _sprite: Sprite = null;
    private _widget: Widget = null;

    onLoad() {
        this._sprite = this.getComponent(Sprite);
        this._widget = this.getComponent(Widget);
    }

    start() {
        this.node.on(Node.EventType.MOUSE_ENTER, this.handleHover, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.handleLeave, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.MOUSE_ENTER, this.handleHover, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.handleLeave, this);
    }

    init(props: PropsType, left: number) {
        this._propsID = props.fields.id.id;
        this._propsType = props.fields.props_type;
        this._quality = props.fields.quality;
        this._imageURL = props.fields.image_url;
        this._effects = props.fields.effects.fields.contents.map(content => {
            return {
                key: content.fields.key,
                value: content.fields.value
            }
        });
        this._widget.target = this.node.parent;
        this._widget.left = left;
        this._isChosen = GameManager.instance.checkIfEquipped(this._propsID);
        this._sprite.grayscale = !this._isChosen;
        const idx = this.getFrameIdx(props.fields.props_type);
        this._sprite.spriteFrame = this.frames[idx];
    }

    getFrameIdx(type: string) {
        if (type === "blood")
            return 0;
        if (type === "attack")
            return 1;
        if (type === "criticalHitRate" || type === "criticalDamage")
            return 2;
        if (type === "moveSpeed")
            return 3;
        return 4;
    }

    handleClickProps() {
        if (this._isChosen) {
            this._sprite.grayscale = this._isChosen;
            this._isChosen = !this._isChosen;
            GameManager.instance.editEquippedIds(this._propsID, false);
            return;
        }
        if (!GameManager.instance.checkIfEquipMore()) {
            GameManager.instance.showError("Can't equip more!");
            return;
        }
        this._sprite.grayscale = this._isChosen;
        this._isChosen = !this._isChosen;
        GameManager.instance.editEquippedIds(this._propsID, true);
    }

    handleHover() {
        GameManager.instance.calcFakePlayerInfo(this._propsID, true);
    }

    handleLeave() {
        GameManager.instance.calcFakePlayerInfo(this._propsID, false);
    }
}

