import * as THREE from 'three';
import { Clock, Color, Line, LineBasicMaterial, MathUtils, Quaternion, Scene, Shape, ShapeGeometry, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three-orbitcontrols-ts';
import { Game, GameState } from './game';
import { FpsCamera, GameplayCamera, OrtoCamera } from './gameplayCamera';
import { loadResources } from './resources';
import { ScorePointView } from './scorePointView';
import { SnakeView } from './snakeView';

loadResources().then(resources => {
	let game = new Game(new Vector3(13, 13, 13), false)
	let logicUpdateInterval = 250
	let isPaused = false

	let canvasParent = document.getElementById('game')!
	let renderer = new WebGLRenderer()
	renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight)
	canvasParent.appendChild( renderer.domElement )

	let scene = new Scene()
	let camera = createCamera()

	let snakeView = new SnakeView(game, scene, resources)

	let useDebugCamera = false
	let debugCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000)
	debugCamera.position.set(2, 12, 20)
	debugCamera.rotation.set(MathUtils.DEG2RAD * -20, MathUtils.DEG2RAD * -20, 0, 'YXZ')
	let debugCameraControls = new OrbitControls(debugCamera, renderer.domElement)
	debugCameraControls.target = new Vector3(game.worldSize.x / 2, game.worldSize.y / 2, game.worldSize.z / 2)
	debugCameraControls.minZoom = 0.5
	debugCameraControls.minZoom = 2

	scene.add(new THREE.AmbientLight('white', 4))

	let gridLineMat = new LineBasicMaterial({ color: 0xFFFFFF })

	createGridCorridor(new Quaternion(),
		new Vector2(game.worldSize.x, game.worldSize.y), game.worldSize.z, new Vector3(0, 0, 0))
	createGridCorridor(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), MathUtils.DEG2RAD * 90), 
		new Vector2(game.worldSize.x, game.worldSize.y), game.worldSize.z, new Vector3(0, 0, game.worldSize.z))
	createGridCorridor(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), MathUtils.DEG2RAD * 90), 
		new Vector2(game.worldSize.x, game.worldSize.y), game.worldSize.z, new Vector3(0, game.worldSize.y, 0))

	function createGridCorridor(dir: Quaternion, size: Vector2, length: number, off: Vector3) {
		for(let i = 0; i <= length; i++) {
			createSquare(new Vector3(0, 0, i).applyQuaternion(dir).add(off))
		}
		
		function createSquare(startPoint: Vector3) {
			let shape = new Shape([
				new Vector2(0, 0), 
				new Vector2(size.x, 0),
				new Vector2(size.x, size.y),
				new Vector2(0, size.y)
			])
			let geo = new ShapeGeometry(shape)

			let line = new Line(geo, gridLineMat);
			line.position.copy(startPoint)
			line.applyQuaternion(dir)
			scene.add(line)
		}
	}
	
	
	let scorePointView: ScorePointView | null = null
	game.scorePointChanged = (newScorePoint: Vector3) => {
		if(scorePointView) 
			scorePointView.remove(scene)
		scorePointView =  new ScorePointView(game, scene, resources, newScorePoint)
	}
	
	let renderClock = new Clock()
	let logicClock = new Clock()
	
	function render() {
		if(!isPaused) {
			let dt = renderClock.getDelta()
			
			snakeView.update(dt)
			scorePointView?.update(dt)
			camera = camera.update(dt)
			
			renderer.render(scene, useDebugCamera ? debugCamera : camera.camera)
		}
		
		requestAnimationFrame(render)
	}
	render()

	let updateTimerHandle: NodeJS.Timeout | null = null
	let lastKeyEvent: KeyboardEvent | null = null
	function logicUpdate() {
		if(isPaused)
			return
		
		if(lastKeyEvent) {
			let ev = lastKeyEvent
			let updateCamera = game.dispatchKeyPress(ev)
			if(updateCamera) {
				camera = createCamera()
			}
		}
		
		game.update()
		let delay = camera.updateFromGame(game)
		
		if(delay > 0) {
			updateTimerHandle && clearInterval(updateTimerHandle)
			setTimeout(() => {
				updateTimerHandle = setInterval(logicUpdate, logicUpdateInterval)
			}, delay)
		}
		
		if(game.gameState == GameState.Lost)
			scene.background = new Color('#550000')
		
		lastKeyEvent = null
		logicClock.getDelta()
	}
	updateTimerHandle = setInterval(logicUpdate, logicUpdateInterval)

	function createCamera(): GameplayCamera {
		let camera = game.isFpsMode ? new FpsCamera(game, canvasParent) : new OrtoCamera(game, canvasParent)
		camera.updateFromGame(game)
		return camera
	}
	
	document.body.addEventListener('keydown', function(ev: KeyboardEvent) {
        let char = ev.key.toLowerCase()
		if(char === 't') {
			useDebugCamera = !useDebugCamera
		} else if(char == 'p') {
			isPaused = !isPaused
		}
		
		lastKeyEvent = ev
	})
	
	window.addEventListener('resize', function() {
		camera.resizeViewport()
		renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight)
	}, false )
})