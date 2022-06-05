import { Vector3, Vector2, Math as Matht,Quaternion } from "three";

export function roundVector2(v: Vector2): Vector2 {
    return new Vector2(Math.round(v.x), Math.round(v.y))
}

export function roundVector3(v: Vector3): Vector3 {
    return new Vector3(Math.round(v.x), Math.round(v.y), Math.round(v.z))
}

export function toVector2(v: Vector3) {
    return new Vector2(v.x, v.y)
}

export function rotateQuaternion(q1: Quaternion, q2: Quaternion) : Quaternion {
    return q1.clone().multiply(q2).multiply(q1.clone().conjugate())
}

export function quaternionToAxisAngle(q: Quaternion): {axis: Vector3, angle: number} {
    let angle = 2 * Math.acos(q.w)
    let x = q.x / Math.sqrt(1-q.w*q.w)
    let y = q.y / Math.sqrt(1-q.w*q.w)
    let z = q.z / Math.sqrt(1-q.w*q.w)
    return {axis: new Vector3(x, y, z), angle }
}

export function printAxisAngle({axis, angle}: {axis: Vector3, angle: number}, name?: string) {
    axis = roundVector3(axis)
    console.log(`${name ? name + ': ' : ''}${axis.x} ${axis.y} ${axis.z} / ${Math.round(angle * Matht.RAD2DEG) % 360}`);
}

export function roundQuaternion(q: Quaternion) {
    let x = Math.round(q.x / Math.PI) * Math.PI
    let y = Math.round(q.y / Math.PI) * Math.PI
    let z = Math.round(q.z / Math.PI) * Math.PI
    let w = Math.round(q.w / Math.PI) * Math.PI
    return new Quaternion(x, y, z, w)
}

export function normalizeZerosInQuaternion(q: Quaternion): Quaternion {
    return new Quaternion(normalizeZero(q.x), normalizeZero(q.y), normalizeZero(q.z), normalizeZero(q.w))
}

export function normalizeZero(n: number): number {
    return Object.is(n, -0) ? 0 : n
}