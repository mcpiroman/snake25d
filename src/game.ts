import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import { Key } from 'ts-key-enum';
import { rotateQuaternion, roundVector3, toVector2 } from './utils';

export class Game {
    worldSize: Vector3
    canPassBorders = true
    isFpsMode: boolean
    
    snake: Snake
    ortoViewOrientation: Quaternion = new Quaternion()
    scorePoint: Vector3 | null = null
    scorePointChanged: (newScorePoint: Vector3) => void = ()=>{}
    
    gameState: GameState = GameState.Playing
    score = 0
    
    constructor(worldSize: Vector3, isFpsMode: boolean) {
        this.worldSize = worldSize
        this.isFpsMode = isFpsMode
        
        this.snake = new Snake(this, new Vector3(
            Math.floor(worldSize.x / 2),
            Math.floor(worldSize.y / 2),
            Math.floor(worldSize.z / 2)
        ))
    }
  
    update() {
        if(this.gameState != GameState.Playing)
            return
            
        if(!this.scorePoint)
            this.addScorePoint()
            
        this.snake.step()
    }
    
    addScore() {
        this.score++
        this.addScorePoint()
    }
    
    loseGame(){
        this.gameState = GameState.Lost
    }
    
    private addScorePoint() {
        let availablePositions: Vector3[] = []
        for(let x = 0; x < this.worldSize.x; x++){
            for(let y = 0; y < this.worldSize.y; y++){
                for(let z = 0; z < this.worldSize.z; z++){
                    availablePositions.push(new Vector3(x, y, z))
                }
            }
        }
        
        for(let s of this.snake.segments) {
            availablePositions.splice(availablePositions.findIndex(v => v.equals(s.pos)), 1)
        }
        
        this.scorePoint = availablePositions[Math.floor(Math.random() * availablePositions.length)]
        this.scorePointChanged(this.scorePoint)
    }
    
    dispatchKeyPress(ev: KeyboardEvent): boolean {
        if(this.gameState != GameState.Playing)
            return false
        
        let char = ev.key.toLowerCase()
        if(char == 'r') {
            this.isFpsMode = !this.isFpsMode
            return true
		} else if(this.isFpsMode) {
            if(ev.key === Key.ArrowUp || char === 'w') {
                this.changeSneakFpsHeading(0)
            } else if(ev.key === Key.ArrowRight || char === 'd') {
                this.changeSneakFpsHeading(1)
            } else if(ev.key === Key.ArrowDown || char === 's') {
                this.changeSneakFpsHeading(2)
            } else if(ev.key === Key.ArrowLeft || char === 'a') {
                this.changeSneakFpsHeading(3)
            }     
        } else {
            if(ev.key === Key.ArrowUp || char === 'w') {
                this.setSnakeOrtoFlatHeading(0)
            } else if(ev.key === Key.ArrowRight || char === 'd') {
                this.setSnakeOrtoFlatHeading(1)
            } else if(ev.key === Key.ArrowDown || char === 's') {
                this.setSnakeOrtoFlatHeading(2)
            } else if(ev.key === Key.ArrowLeft || char === 'a') {
                this.setSnakeOrtoFlatHeading(3)
            } else if(char === 'e') {
                this.changeSnakeOrtoDepthHeading(true)
            } else if(char === 'q') {
                this.changeSnakeOrtoDepthHeading(false)
            }
        }
        
        return false
    }
    
    private changeSnakeOrtoDepthHeading(forwardOrBackward: boolean) {
        let snake2viewDiff = this.snake.orientation.clone().multiply(this.ortoViewOrientation.clone().invert())
        let snake2screenDiff = rotateQuaternion(this.snake.orientation.clone().invert(), snake2viewDiff)
        
        let pitchDiff = new Quaternion().setFromEuler(new Euler(Math.PI / 2 * (forwardOrBackward ? 1 : -1), 0, 0))
        pitchDiff.x = -pitchDiff.x
        pitchDiff.z = -pitchDiff.z
        
        let viewRot = rotateQuaternion(snake2screenDiff, pitchDiff)
        this.ortoViewOrientation.multiply(viewRot)
        
        this.snake.orientation = this.snake.orientation.multiply(pitchDiff)
    }
    
    private setSnakeOrtoFlatHeading(flatHeading: number) {
        let rollRot = new Quaternion().setFromEuler(new Euler(0, 0, -Math.PI / 2 * flatHeading))
        this.snake.orientation = this.ortoViewOrientation.clone().multiply(rollRot)
    }
    
    private changeSneakFpsHeading(dir: number){
        let pitchDiff = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0))
        let rollRot = new Quaternion().setFromEuler(new Euler(0, Math.PI / 2 * dir, 0))
        let rot = rotateQuaternion(rollRot, pitchDiff)
        this.snake.orientation = this.snake.orientation.multiply(rot)
        this.ortoViewOrientation = this.snake.orientation.clone()
    }
    
    projectVectorToView(v: Vector3): Vector3 {
        let p = v.clone().applyQuaternion(this.ortoViewOrientation.clone().invert())
        return roundVector3(p)
    }
}

export enum GameState {
    Playing,
    Won,
    Lost
}

export interface SnakeSegment {
    pos: Vector3
    rot: Quaternion
}

export class Snake {
    segments: SnakeSegment[]
    onMove: (newHead: Vector3, movedTail: boolean) => void = ()=>{}
    private growQueue: number[] = new Array(1).fill(0).map((_, i) => i + 1)
    
    private _orientation: Quaternion = new Quaternion()
    get orientation() {
        return this._orientation.clone()
    }
    set orientation(value: Quaternion) {
        let a = roundVector3(new Vector3(0, 1, 0).applyQuaternion(this._orientation))
        let b = roundVector3(new Vector3(0, 1, 0).applyQuaternion(value))
        
        if(a.dot(b) == 0)
            this._orientation = value
    }
    
    get head(): SnakeSegment {
        return this.segments[this.segments.length - 1]
    }
    
    constructor(private game: Game, startPos: Vector3) {
        this.segments = [{pos: startPos, rot: this.orientation}]
    }
    
    step() {
        let oldHead = this.head.pos
           
        let dir = roundVector3(new Vector3(0, 1, 0).applyQuaternion(this.orientation))
        let newHead = this.head.pos.clone().add(dir)
        
        if(this.game.canPassBorders) {
            newHead.x = MathUtils.euclideanModulo(newHead.x, this.game.worldSize.x)
            newHead.y = MathUtils.euclideanModulo(newHead.y, this.game.worldSize.y)
            newHead.z = MathUtils.euclideanModulo(newHead.z, this.game.worldSize.z)
        }
        
        let movedTail = false
        this.growQueue = this.growQueue.map(s => s - 1)
        if(this.growQueue.length > 0 && this.growQueue[0] === 0) {
            this.growQueue.shift()
        } else {
            this.segments.shift()
            movedTail = true
        }
        
        if(this.checkCollisionWithSelf(oldHead, newHead)) {
            this.game.loseGame()
            return
        }
        
        this.segments.push({pos: newHead, rot: this.orientation})
        
        let newHeadFlat = toVector2(this.game.projectVectorToView(newHead))
        if(this.game.scorePoint) {
            let score = this.game.isFpsMode ? 
                this.game.scorePoint.equals(newHead) :
                toVector2(this.game.projectVectorToView(this.game.scorePoint)).equals(newHeadFlat)
            if(score) {
                this.growQueue.push(this.segments.length)
                this.game.addScore()
            }  
        } 
        
        this.onMove(newHead, movedTail)
    }
    
    private checkCollisionWithSelf(oldHead: Vector3, newHead: Vector3): boolean {
        if(this.segments.some(s => s.pos.equals(newHead)))
            return true
        
        if(this.game.isFpsMode) {
            return false   
        } else {
            let oldHeadFlat = toVector2(this.game.projectVectorToView(oldHead))
            if(this.segments.slice(0, this.segments.length-1)
                .some(s => toVector2(this.game.projectVectorToView(s.pos)).equals(oldHeadFlat)))
            return false
            
            let newHeadFlat = toVector2(this.game.projectVectorToView(newHead))
            return this.segments.some(s => toVector2(this.game.projectVectorToView(s.pos)).equals(newHeadFlat))
        }
    }
}