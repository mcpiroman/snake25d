import * as THREE from 'three';
import { Snake, Game } from './game';
import { Resources } from './resources';
import { Scene, Object3D, Vector3, Euler, Quaternion, Vector2 } from 'three';
import { roundVector3, rotateQuaternion, printAxisAngle, quaternionToAxisAngle, normalizeZerosInQuaternion } from './utils';

export class SnakeView {
    private snake: Snake
    private segmentObjs: Object3D[] = []
    
    constructor(game: Game, private scene: Scene, private resources: Resources) {
        this.snake = game.snake
        this.scene = scene
        this.resources = resources
        
        this.snake.onMove = this.onMoved.bind(this)
        this.onMoved(this.snake.head.pos, false)
    }
    
    onMoved(newHeadPos: Vector3, movedTail: boolean) {
        let headSeg = this.resources.headModel.clone()
        headSeg.position.copy(newHeadPos).addScalar(0.5)
        
        let headRot = this.snake.orientation
        
        headSeg.quaternion.copy(headRot)
        this.segmentObjs.push(headSeg)
        this.scene.add(headSeg)
        
        if(movedTail) {
            let oldTail = this.segmentObjs.shift()!
            this.scene.remove(oldTail)
        }
        
        this.updateSegments()
    }
    
    update(dt: number) {
    }
    
    private updateSegments() {
        if(this.segmentObjs.length >= 2) {
            let tailSeg = this.segmentObjs[0]
            let tailPos = tailSeg.position
            this.scene.remove(tailSeg)
            
            tailSeg = this.resources.tailModel.clone()
            tailSeg.position.copy(tailPos)
            tailSeg.quaternion.copy(this.segmentObjs[1].quaternion)
            
            this.segmentObjs.splice(0, 1, tailSeg)
            this.scene.add(tailSeg)
        }
        
        if(this.segmentObjs.length >= 3) {
            let neckSeg = this.segmentObjs[this.segmentObjs.length - 2]
            let neckPos = neckSeg.position
            this.scene.remove(neckSeg)
            
            let headRot = this.snake.head.rot
            let neckRot = this.snake.segments[this.snake.segments.length - 2].rot
            
            // Like what?? This gotta be a bug in JS.
            headRot = normalizeZerosInQuaternion(headRot)
            neckRot = normalizeZerosInQuaternion(neckRot)
            
            let q1 = headRot.clone().multiply(neckRot.clone().inverse())
            let q2 = rotateQuaternion(headRot.inverse(), q1)
            let neckToHeadDir = roundVector3(new Vector3(0, 1, 0).applyQuaternion(q2))
            
            if(neckToHeadDir.y != 0) {
                neckSeg = this.resources.bodyModel.clone()
            } else if(neckToHeadDir.z > 0) {
                neckSeg = this.resources.bendVertUpModel.clone()
            } else if(neckToHeadDir.z < 0) {
                neckSeg = this.resources.bendVertDownModel.clone()
            } else {
                neckSeg = this.resources.bendFlatModel.clone()
                if(neckToHeadDir.x < 0)
                    neckSeg.scale.setX(-1)
            }
            
            neckSeg.position.copy(neckPos)
            neckSeg.quaternion.copy(neckRot)
            
            this.segmentObjs.splice(this.segmentObjs.length - 2, 1, neckSeg)
            this.scene.add(neckSeg)
        }
    }
}