import Vec3D, { NormalizedVec3D } from "./Vec3D";

console.log("Loading renderer!");

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const WIDTH = 512;
const HEIGHT = 512;

const imageData = ctx.createImageData(WIDTH, HEIGHT);
const data = imageData.data;

type Pos = {
    x: number;
    y: number;
}

const COLOR_MAX = 255;
type Color = {
    r: number;
    g: number;
    b: number;
    a?: number;
}

function setPixel(data: Uint8ClampedArray, pos: Pos, color: Color) {
    // TODO enforce within bounds.

    const pixelsOffset = pos.y * WIDTH + pos.x;
    const PIXEL_DEPTH = 4;
    const offset = pixelsOffset * 4;
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
    data[offset + 3] = color.a || 255;
}

function repeat(times: number, fn: (index: number) => void) {
    for (let i = 0; i < times; i++) {
        fn(i);
    }
}

function intersectSphere(pos: Vec3D, dir: Vec3D, sphereCenter: Vec3D, radius: number): false | number {
    const planeNormal = dir.inverse();
    const rayTraversal = ((sphereCenter.minus(pos)).dot(planeNormal) / dir.dot(planeNormal));
    const planeCollision = pos.plus(dir.times(rayTraversal));

    const dist = planeCollision.minus(sphereCenter).magnitude();

    if (dist < radius) {
        return dist;
    }

    return false;
}

function render(position: Pos): Color {
    // Take a position on the camera plane and convert to a vector.

    // TODO frustrum.
    const pt: Vec3D = Vec3D.Create({
        x: position.x,
        y: position.y,
        z: 0
    });

    const dir: Vec3D = Vec3D.Create({
        x: 0,
        y: 0,
        z: 1
    });
    
    const RADIUS = 50;
    const CIRCLES: Array<{center: Vec3D; radius: number}> = [
        { center: new Vec3D(200, 150, 40), radius: RADIUS },
        { center: new Vec3D(200, 200, 40), radius: RADIUS },
        { center: new Vec3D(210, 200, 90), radius: RADIUS },
    ];

    const collisions = CIRCLES
        .map((c) => intersectSphere(pt, dir, c.center, c.radius))
        .filter((res) => res !== false)
        .sort() as number[];

    if (collisions.length > 0) {
        const lastCollision = collisions[0];
        return {
            r: 0,
            g: ((1 - (lastCollision / RADIUS)) * 0.5 + 0.5) * COLOR_MAX, 
            b: 0
        };
    }

    return { r: position.x / WIDTH * COLOR_MAX, g: 0, b: position.y / HEIGHT * COLOR_MAX };
}

repeat(WIDTH, (x) => {
    repeat(HEIGHT, (y) => {
        const pos: Pos = { x, y };
        setPixel(data, pos, render(pos));
    })
})

ctx.putImageData(imageData, 0, 0);