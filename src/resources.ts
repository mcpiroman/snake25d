import { Object3D } from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';


export interface Resources {
    appleModel: Object3D
    bodyModel: Object3D
    headModel: Object3D
    tailModel: Object3D
    bendFlatModel: Object3D
    bendVertUpModel: Object3D
    bendVertDownModel: Object3D
}

export async function loadResources(): Promise<Resources> {
    let appleModel: Object3D = null!
    let bodyModel: Object3D = null!
    let headModel: Object3D = null!
    let tailModel: Object3D = null!
    let bendFlatModel: Object3D = null!
    let bendVertUpModel: Object3D = null!
    let bendVertDownModel: Object3D = null!
    
    let jobs: Promise<unknown>[] = []
    
    jobs.push(loadObjModel('apple').then(m => appleModel = m))
    jobs.push(loadObjModel('body').then(m => bodyModel = m))
    jobs.push(loadObjModel('head').then(m => headModel = m))
    jobs.push(loadObjModel('tail').then(m => tailModel = m))
    jobs.push(loadObjModel('bendFlat').then(m => bendFlatModel = m))
    jobs.push(loadObjModel('bendVertUp').then(m => bendVertUpModel = m))
    jobs.push(loadObjModel('bendVertDown').then(m => bendVertDownModel = m))
    
    await Promise.all(jobs)
    
    return {appleModel, bodyModel, headModel, tailModel, bendFlatModel, bendVertUpModel, bendVertDownModel}
}


async function loadObjModel(name: string): Promise<Object3D> {
    return new Promise((resolve, reject) => {
        new MTLLoader()
            .load(`models/${name}.mtl`, function (materials) {
            
            new OBJLoader()
                .setMaterials(materials)
                .load(`models/${name}.obj`, function (object) {
                    resolve(object)
                }, undefined, err => reject(err))
        }, undefined, err => reject(err))
    })
}