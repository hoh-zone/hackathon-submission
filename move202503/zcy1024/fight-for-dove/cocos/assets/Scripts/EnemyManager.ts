import {_decorator, Component, Prefab} from 'cc';
import {GameManager} from "db://assets/Scripts/GameManager";
import {Enemy} from "db://assets/Scripts/Enemy";

const {ccclass, property} = _decorator;

@ccclass('EnemyManager')
export class EnemyManager extends Component {
    @property({type: Prefab})
    enemyPrefab: Prefab = null;

    private _refreshTimer = 3;

    update(deltaTime: number) {
        if (this.canGenerateEnemy()) {
            this.generateEnemy();
            this._refreshTimer = Math.max(0.5, 5.2 - GameManager.instance.curLevel * 0.2);
            return;
        }
        this._refreshTimer -= deltaTime;
        if (this._refreshTimer <= 0) {
            this.generateEnemy();
            this._refreshTimer = Math.max(0.5, 5.2 - GameManager.instance.curLevel * 0.2);
        }
    }

    canGenerateEnemy() {
        return Math.random() * Math.max(2, 666 - GameManager.instance.curLevel * 10) < 1;
    }

    generateEnemy() {
        const enemy = GameManager.instance.getNode(this.enemyPrefab);
        enemy.setParent(this.node);
        enemy.setPosition((Math.random() < 0.5 ? 1 : -1) * Math.random() * 500, Math.random() * 365, 0);
        enemy.getComponent(Enemy).init(5000 + 50 * (10 + GameManager.instance.curLevel - 1) * (GameManager.instance.curLevel - 1));
    }

    clearAllNodes() {
        while (true) {
            const enemy = this.node.getChildByName("EnemyPrefab");
            if (!enemy)
                break;
            GameManager.instance.putNode(enemy);
        }
        while (true) {
            const enemy = this.node.getChildByName("DmgPrefab");
            if (!enemy)
                break;
            GameManager.instance.putNode(enemy);
        }
    }
}

