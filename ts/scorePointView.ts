import * as THREE from 'three';
import { Snake, Game } from './game';
import { Resources } from './resources';
import { Scene, Object3D, Vector3, Euler, Quaternion, Vector2 } from 'three';
import { roundVector3, rotateQuaternion, printAxisAngle, quaternionToAxisAngle, normalizeZerosInQuaternion } from './utils';

export class ScorePointView {
    private scorePointObj: Object3D
    private wavingSpeed = 0.5
    private wavingDist = 10 / 240
    private wavingTimer = 0
    
    constructor(private game: Game, scene: Scene, resources: Resources, private position: Vector3) {
        this.scorePointObj = resources.appleModel.clone()
        
        if(game.isFpsMode) {
            this.scorePointObj.quaternion.copy(game.snake.orientation)
        } else {
            this.scorePointObj.quaternion.copy(game.ortoViewOrientation)
        }
        
        scene.add(this.scorePointObj)
    }

    
    update(dt: number) {
        this.wavingTimer += dt
        let dist = this.wavingDist * Math.sin(this.wavingTimer * this.wavingSpeed * Math.PI)
        let pos = this.position.clone().addScalar(0.5)
        
        let wavingRot: Quaternion
        if(this.game.isFpsMode) {
            wavingRot = this.game.snake.orientation.clone()
            let pitchDiff = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0))
            wavingRot.multiply(pitchDiff)
        } else {
            wavingRot = this.game.ortoViewOrientation.clone()
        }
        
        pos.add(new Vector3(0, dist, 0).applyQuaternion(wavingRot))
        
        this.scorePointObj.position.copy(pos)
    }
    
    remove(scene: Scene) {
        scene.remove(this.scorePointObj)
    }
}