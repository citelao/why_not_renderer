import Vec3D, { NormalizedVec3D } from "./Vec3D";

const EPSILON = 0.0008;

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

const WHITE: Color = {
    r: COLOR_MAX,
    g: COLOR_MAX,
    b: COLOR_MAX
};

const BLACK: Color = {
    r: 0,
    g: 0,
    b: 0
};

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

function intersectSphere(pos: Vec3D, dir: Vec3D, sphereCenter: Vec3D, radius: number): Vec3D[] {
    const planeNormal = dir.inverse();
    const rayTraversal = ((sphereCenter.minus(pos)).dot(planeNormal) / dir.dot(planeNormal));
    const planeCollision = pos.plus(dir.times(rayTraversal));

    const dist = planeCollision.minus(sphereCenter).magnitude();

    // If the distance is farther than the radius, we did not intersect the
    // sphere.
    if (dist > radius) {
        return [];
    }

    // Use the pythagorean theorem to get the intersections' offsets from the
    // plane collision point.
    const offset = Math.sqrt(dist * dist + radius * radius);
    const offsetRay = dir.times(offset);

    if (radius - dist < EPSILON) {
        // This is close enough to a glancing blow just to return one
        // intersection:
        return [
            planeCollision
        ];
    }

    // If we get here, there are two intersections: before and after the normal
    // plane.
    const intersections = [
        planeCollision.minus(offsetRay),
        planeCollision.plus(offsetRay)
    ];

    return intersections;
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

    // Get collisions.
    // TODO sorted by Z-order.
    const collisions = CIRCLES
        .map((c) => intersectSphere(pt, dir, c.center, c.radius))
        .filter((res) => res.length !== 0)
        .reduce((accum, val) => accum.concat(val), [])
        .sort((a, b): number => {
            const depthA = a.minus(pt).magnitude();
            const depthB = b.minus(pt).magnitude();

            return depthA - depthB;
        });

    if (collisions.length > 0) {
        const lastCollision = collisions[0];
        const depth = lastCollision.minus(pt).magnitude();

        const color = (1 - (depth / 200)) * COLOR_MAX;

        return {
            r: color,
            g: color, 
            b: color
        };
    }

    return BLACK;
}

repeat(WIDTH, (x) => {
    repeat(HEIGHT, (y) => {
        const pos: Pos = { x, y };
        setPixel(data, pos, render(pos));
    })
})

ctx.putImageData(imageData, 0, 0);