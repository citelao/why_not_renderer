import Vec3D from "./Vec3D";
import Ray3D from "./Ray3D";

const EPSILON = 0.0008;

console.log("Loading renderer!");

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

// const render_type_radios = document.getElementsByName("render_type");

type RenderMode = "regular" | "depth";
let renderMode: RenderMode = "regular";

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

const RED: Color = {
    r: COLOR_MAX,
    g: 0,
    b: 0
};

const GREEN: Color = {
    r: 0,
    g: COLOR_MAX,
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

function flatten<T>(array: Array<Array<T>>): Array<T> {
    return array.reduce((accum, val) => accum.concat(val), []);
}

interface ICollision {
    point: Vec3D;
    normal: Vec3D;
}

function intersectSphere(ray: Ray3D, sphereCenter: Vec3D, radius: number): ICollision[] {
    const planeNormal = ray.dir.inverse();
    const rayTraversal = ((sphereCenter.minus(ray.pt)).dot(planeNormal) / ray.dir.dot(planeNormal));

    if (rayTraversal < 0) {
        // Sphere is behind.
        return [];
    }

    const planeCollision = ray.pt.plus(ray.dir.times(rayTraversal));

    const dist = planeCollision.minus(sphereCenter).magnitude();

    // If the distance is farther than the radius, we did not intersect the
    // sphere.
    if (dist > radius) {
        return [];
    }

    // Use the pythagorean theorem to get the intersections' offsets from the
    // plane collision point.
    const offset = Math.sqrt((radius * radius) - (dist * dist));
    // console.log(offset);
    const offsetRay = ray.dir.times(offset);

    if (radius - dist < EPSILON) {
        // This is close enough to a glancing blow just to return one
        // intersection:
        return [
            // planeCollision
        ];
    }

    // If we get here, there are two intersections: before and after the normal
    // plane.

    const pointA = planeCollision.minus(offsetRay);
    const normalA = pointA.minus(sphereCenter).normalized();

    const pointB = planeCollision.plus(offsetRay);
    const normalB = pointA.minus(sphereCenter).normalized();

    const intersections = [
        { point: pointA, normal: normalA },
        { point: pointB, normal: normalB },
    ];

    return intersections;
}

interface IMaterial {
    /** Number from 0-1 saying how much to spread bounce rays. Proxy for
     * reflectance. */
    spread: number;

    intrinsicColor: Color;
}

interface ICircle {
    type: "circle";
    center: Vec3D;
    radius: number;
    material: IMaterial;
}
interface ILight {
    type: "light";
    center: Vec3D;
    intensity: number;
    radius: number;
}
type ISceneObject = ICircle | ILight;
interface IScene {
    objects: Array<ISceneObject>;
}

/** Send a ray through the scene for collisions. Sorted by distance to ray start. */
function collideRay(scene: IScene, ray: Ray3D): Array<{
    object: ISceneObject,
    collision: ICollision
}> {
    // Get collisions.
    const collisions = scene.objects
        .map((o) => {
            return {
                obj: o,
                collisions: intersectSphere(ray, o.center, o.radius)
            };
        })
        .filter((res) => res.collisions.length !== 0)
        .reduce<Array<{
            object: ISceneObject,
            collision: ICollision
        }>>((accum, val) => accum.concat(val.collisions.map((col) => {
            return {
                object: val.obj,
                collision: col
            };
        })), [])
        .sort((a, b): number => {
            const depthA = a.collision.point.minus(ray.pt).magnitude();
            const depthB = b.collision.point.minus(ray.pt).magnitude();

            return depthA - depthB;
        });

    return collisions;
}

function normalToColor(normal: Vec3D): Color {
    const mid = COLOR_MAX / 2;
    return {
        r: 0.5 * normal.x * COLOR_MAX + mid,
        g: 0.5 * normal.y * COLOR_MAX + mid,
        b: 0.5 * normal.z * COLOR_MAX + mid,
    }
}

function perturb(vec: Vec3D, amount: number): Vec3D {
    const randomVector = Vec3D.CreateRandomNormal();
    return vec.plus(randomVector.times(amount));
}

function cast(scene: IScene, ray: Ray3D, iteration = 0): Color {
    // Get collisions.
    const collisions = collideRay(scene, ray);

    // If we had no collisions, return black.
    if (collisions.length === 0) {
        return BLACK;
    }

    const lastCollision = collisions[0];

    if (renderMode === "depth") {
        // Simply find the depth and return that as our color.
        const depth = lastCollision.collision.point.minus(ray.pt).magnitude();
        const color = Math.min(COLOR_MAX, (1 - (depth / 300)) * COLOR_MAX);
        return {
            r: color,
            g: color, 
            b: color
        };
    }

    // Stop if we've bounced too much!
    const MAX_BOUNCES = 3;
    if (iteration >= MAX_BOUNCES) {
        return BLACK;
    }

    // Lights are immediate light sources
    if (lastCollision.object.type === "light") {
        return WHITE;
    }

    const bounceNorm = ray.dir.bounceNormal(lastCollision.collision.normal);
    const newPt: Vec3D = lastCollision.collision.point;
    const newRay = Ray3D.Create({
        pt: newPt,
        dir: bounceNorm
    });

    const BOUNCE_COUNT = 5;
    const SPREAD_AMOUNT = 0.8;
    const bounces: Color[] = [];
    repeat(BOUNCE_COUNT, (i) => {
        const perturbedRay = Ray3D.Create({
            pt: newRay.pt,
            dir: perturb(newRay.dir, (lastCollision.object as ICircle).material.spread)
        })
        bounces.push(cast(SCENE,
            perturbedRay,
            iteration + 1));
    });

    const bounce = bounces.reduce((accum, c) => {
        const factor = BOUNCE_COUNT;
        const intrinsicColor = (lastCollision.object as ICircle).material.intrinsicColor;
        return {
            r: accum.r + (c.r / factor * (intrinsicColor.r / COLOR_MAX)),
            g: accum.g + (c.g / factor * (intrinsicColor.g / COLOR_MAX)),
            b: accum.b + (c.b / factor * (intrinsicColor.b / COLOR_MAX))
        };
    }, BLACK);

    // TODO light intensity.

    return bounce;
}

function getRayForScreenCoordinates(pos: Pos): Ray3D {
    // Take a position on the camera plane and convert to a vector.
    // TODO frustrum.
    const pt: Vec3D = Vec3D.Create({
        x: pos.x,
        y: pos.y,
        z: 0
    });

    const dir: Vec3D = Vec3D.Create({
        x: 0,
        y: 0,
        z: 1
    });

    return Ray3D.Create({
        pt,
        dir
    });
}

// Generate scene
const RADIUS = 50;
const CIRCLES: Array<ICircle> = [];
repeat(5, (i) => {
    repeat(5, (j) => {
        const x = RADIUS + (RADIUS + 5) * i * 2;
        const y = RADIUS + (RADIUS / 2) * j * 2;
        const z = ((60 * j) + 60);
        CIRCLES.push({
            type: "circle",
            center: new Vec3D(x, y, z),
            radius: RADIUS,
            material: {
                spread: (j / 5),
                intrinsicColor: {
                    r: i * 50 + 10,
                    g: (j + i) * 20 + 50,
                    b: j * 70 + 10
                }
            }
        });
    });
});
repeat(5, (i) => {
    repeat(5, (j) => {
        const x = RADIUS + (RADIUS + 5) * i * 2 + 20;
        const y = RADIUS + (RADIUS / 2) * j * 2 + 370;
        const z = ((60 * j) + 60);
        CIRCLES.push({
            type: "circle",
            center: new Vec3D(x, y, z),
            radius: RADIUS,
            material: {
                spread: (j / 5),
                intrinsicColor: WHITE
            }
        });
    });
});
const LIGHTS: Array<ILight> = [
    { type: "light", center: new Vec3D(600, 650, 300), intensity: 100, radius: 300 },
    { type: "light", center: new Vec3D(100, 400, 300), intensity: 100, radius: 20 },
];
const SCENE: IScene = {
    objects: [
        ... CIRCLES,
        ... LIGHTS
    ]
};

async function breathe(): Promise<number> {
    return new Promise<number>(requestAnimationFrame);
}

async function run() {
    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            const pos: Pos = { x, y };
    
            // Take a position on the camera plane and convert to a vector.
            // TODO frustrum.
            const ray = getRayForScreenCoordinates(pos);
            setPixel(data, pos, cast(SCENE, ray));
        }

        ctx.putImageData(imageData, 0, 0);

        await breathe();
    }

    // Draw a scale!
    const SCALE_SIZE = 50;
    const SCALE_LOC: Pos = { x: WIDTH - 100, y: HEIGHT - 100 };
    repeat(SCALE_SIZE, (x) => {
        const pos: Pos = { x: SCALE_LOC.x + x, y: SCALE_LOC.y };
        setPixel(data, pos, RED);
    });
    repeat(SCALE_SIZE, (y) => {
        const pos: Pos = { x: SCALE_LOC.x, y: SCALE_LOC.y + y };
        setPixel(data, pos, GREEN);
    });

}

run()
    .catch((error) => {
        console.error(error);
    });

// render_type_radios.forEach((r) => {
//     (r as HTMLInputElement).addEventListener("change", function (e) {
//         switch(this.value) {
//         case "regular":
//             renderMode = "regular";
//             break;
//         case "depth":
//             renderMode = "depth";
//             break;
//         default:
//             throw new Error(`Unknown value '${this.value}'`);
//         }
//     });
// });

canvas.addEventListener("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const ray = getRayForScreenCoordinates(pos);

    const collisions = collideRay(SCENE, ray);
    if (collisions.length === 0) {
        return;
    }

    // // const newPt: Vec3D = collisions[0].collision.point.plus(newNorm.times(1));

    // const bounceNorm = ray.dir.bounceNormal(collisions[0].collision.normal).normalized();
    // const newPt: Vec3D = collisions[0].collision.point.plus(bounceNorm);
    // const newRay = Ray3D.Create({
    //     pt: newPt,
    //     dir: bounceNorm
    // });

    // // const res = bounceNorm;
    // const collisions2 = collideRay(SCENE, newRay);
    // // const res = newNorm;
    // const res = (collisions2.length === 0)
    //     ? "NO"
    //     : collisions2[0].circle.center;

    // console.log(
    //     // cast(SCENE, pt, dir),
    //     collisions[0].circle.center,
    //     res,
    //     // collisions[0].collision.point,
    //     // collisions2[0].collision.point
    // );
});