import Ola from 'ola';
import { Camera, Euler, OrthographicCamera, PerspectiveCamera, Quaternion, Vector2, Vector3, Vector4 } from "three";
import { Game } from './game';

export abstract class GameplayCamera {
    abstract camera: Camera
    
    protected get aspectRatio(): number{
        return this.canvasParent.clientWidth / this.canvasParent.clientHeight
    }
    
    constructor(protected game: Readonly<Game>, protected canvasParent: HTMLElement) {
    }
    
    abstract update(dt: number): GameplayCamera
    abstract updateFromGame(game: Readonly<Game>): number
    abstract resizeViewport()
}

export class OrtoCamera extends GameplayCamera{
    camera: OrthographicCamera
    private center: Vector3
    private distanceFormCenter: number
    
    private aminRotOrigin: Quaternion
    private aminRotTarget: Quaternion
    private rotAnim = Ola(0, 0)
    
    constructor(game: Readonly<Game>, canvasParent: HTMLElement) {
        super(game, canvasParent)
        let worldSize = game.worldSize
        this.distanceFormCenter = Math.sqrt(worldSize.x**2 + worldSize.y** 2 + worldSize.z** 2) * 1.1
        
        let sizes = this.calcCameraSizes()
        this.camera = new OrthographicCamera(sizes.x, sizes.y, sizes.z, sizes.w, 1, 1000)
    
        this.center = new Vector3(worldSize.x / 2, worldSize.y / 2, worldSize.z / 2)
        this.aminRotOrigin = game.ortoViewOrientation.clone()
        this.aminRotTarget = game.ortoViewOrientation.clone()
    }
    
    updateFromGame(game: Readonly<Game>): number {
        if(!this.aminRotTarget.equals(game.ortoViewOrientation)) {
            this.aminRotOrigin = this.camera.quaternion.clone()
            this.aminRotTarget = game.ortoViewOrientation.clone()
            this.rotAnim = Ola(0, 500)
            this.rotAnim.value = 1
            return 400
        } else {
            return 0
        }
    }
    
    update(dt: number): GameplayCamera {
        this.camera.quaternion.slerpQuaternions(this.aminRotOrigin, this.aminRotTarget, this.rotAnim.value)
        let pos = new Vector3(0, 0, this.distanceFormCenter).applyQuaternion(this.camera.quaternion).add(this.center)
        this.camera.position.copy(pos)
        
        return this
    }
    resizeViewport() {
        let sizes = this.calcCameraSizes()
        this.camera.left = sizes.x
        this.camera.right = sizes.y
        this.camera.top = sizes.z
        this.camera.bottom = sizes.w
        this.camera.updateProjectionMatrix()
    }
    
    private calcCameraSizes(): Vector4 {
        let worldSize = this.game.worldSize
        let frustumSize = Math.max(worldSize.x, worldSize.y, worldSize.z) + 1
        let size = this.aspectRatio > 1 ? 
            new Vector2(frustumSize * this.aspectRatio, frustumSize) :
            new Vector2(frustumSize, frustumSize / this.aspectRatio)
        return new Vector4(-size.x / 2, size.x / 2, size.y / 2, -size.y / 2)
    }
}

export class FpsCamera extends GameplayCamera {
    camera: PerspectiveCamera
    private sneakHeadPos: Vector3 = new Vector3()
    private lastSneakOrientation: Quaternion
    private aminRotOrigin: Quaternion
    private aminRotTarget: Quaternion
    private distanceFormHead = -0.08
    private rotAnim = Ola(0, 0)
    
    constructor(game: Readonly<Game>, canvasParent: HTMLElement) {
        super(game, canvasParent)
        this.camera = new PerspectiveCamera(90, this.aspectRatio, 0.1, 100)
        this.aminRotOrigin = this.calcCameraRotation(game.snake.orientation)
        this.aminRotTarget = this.aminRotOrigin.clone()
        this.lastSneakOrientation = game.snake.orientation.clone()
    }
    
    updateFromGame(game: Readonly<Game>): number {
        this.sneakHeadPos = game.snake.head.pos
        
        if(!game.snake.orientation.equals(this.lastSneakOrientation)) {
            this.lastSneakOrientation = game.snake.orientation
            this.aminRotOrigin = this.camera.quaternion.clone()
            this.aminRotTarget = this.calcCameraRotation(game.snake.orientation)
            this.rotAnim = Ola(0, 500)
            this.rotAnim.value = 1
            return 200
        } else {
            return 0
        }
    }
    
    private calcCameraRotation(sneakOrientation: Quaternion) {
        return new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0))
            .premultiply(sneakOrientation)
    }
    
    update(dt: number): GameplayCamera {
        this.camera.quaternion.slerpQuaternions(this.aminRotOrigin, this.aminRotTarget, this.rotAnim.value)
        
        let cameraPos = this.sneakHeadPos.clone().addScalar(.5)
        cameraPos.add(new Vector3(0, 0, -0.5 - this.distanceFormHead).applyQuaternion(this.camera.quaternion))
        this.camera.position.copy(cameraPos)
        
        return this
    }
    
    resizeViewport() {
        this.camera.aspect = this.aspectRatio
        this.camera.updateProjectionMatrix()
    }
}