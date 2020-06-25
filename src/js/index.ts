import Vec3D from "./Vec3D";

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

function intersectSphere(pos: Vec3D, dir: Vec3D, sphereCenter: Vec3D, radius: number): ICollision[] {
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
    const offset = Math.sqrt((radius * radius) - (dist * dist));
    // console.log(offset);
    const offsetRay = dir.times(offset);

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

interface ICircle {
    center: Vec3D;
    radius: number;
}
interface IScene {
    circles: Array<ICircle>;
}

function collideRay(scene: IScene, pt: Vec3D, dir: Vec3D): Array<{
    circle: ICircle,
    collision: ICollision
}> {
    // Get collisions.
    const collisions = scene.circles
        .map((c) => {
            return {
                circle: c,
                collisions: intersectSphere(pt, dir, c.center, c.radius)
            };
        })
        .filter((res) => res.collisions.length !== 0)
        .reduce<Array<{
            circle: ICircle,
            collision: ICollision
        }>>((accum, val) => accum.concat(val.collisions.map((col) => {
            return {
                circle: val.circle,
                collision: col
            };
        })), [])
        .sort((a, b): number => {
            const depthA = a.collision.point.minus(pt).magnitude();
            const depthB = b.collision.point.minus(pt).magnitude();

            return depthA - depthB;
        });

    return collisions;
}

function cast(scene: IScene, pt: Vec3D, dir: Vec3D, iteration = 0): Color {
    // Get collisions.
    const collisions = collideRay(scene, pt, dir);

    if (collisions.length > 0) {
        const lastCollision = collisions[0];
        const depth = lastCollision.collision.point.minus(pt).magnitude();
        const color = COLOR_MAX; //Math.min(COLOR_MAX, (1 - (depth / 300)) * COLOR_MAX);

        const MAX_MAGNITUDE = 1;
        if (iteration >= MAX_MAGNITUDE) {
            return {
                r: color,
                g: color, 
                b: color
            };
        }

        // const newPt: Vec3D = lastCollision.collision.plus(newNorm);

        return {
            r: lastCollision.collision.normal.x * COLOR_MAX,
            g: lastCollision.collision.normal.y * COLOR_MAX,
            b: lastCollision.collision.normal.z * COLOR_MAX,
        }

        // const bounce = cast(newPt,
        //     newNorm,
        //     iteration + 1);

        // return bounce;

        return {
            r: color,
            g: color, 
            b: color
        };
    }

    return BLACK;
}

function getRayForScreenCoordinates(pos: Pos): { pt: Vec3D, dir: Vec3D } {
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

    return {
        pt,
        dir
    };
}

// Generate scene
const RADIUS = 50;
const CIRCLES: Array<{center: Vec3D; radius: number}> = [];
repeat(5, (i) => {
    repeat(5, (j) => {
        const x = RADIUS + (RADIUS + 5) * i * 2;
        const y = RADIUS + (RADIUS / 2) * j * 2;
        const z = (60 * j) + 60;
        CIRCLES.push({
            center: new Vec3D(x, y, z),
            radius: RADIUS
        });
    });
});
const SCENE: IScene = {
    circles: CIRCLES
};

repeat(WIDTH, (x) => {
    repeat(HEIGHT, (y) => {
        const pos: Pos = { x, y };

        // Take a position on the camera plane and convert to a vector.
        // TODO frustrum.
        const { pt, dir } = getRayForScreenCoordinates(pos);
        setPixel(data, pos, cast(SCENE, pt, dir));
    })
})

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

ctx.putImageData(imageData, 0, 0);

canvas.addEventListener("mousemove", function (e) {
    const rect = this.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const { pt, dir } = getRayForScreenCoordinates(pos);

    const collisions = collideRay(SCENE, pt, dir);
    if (collisions.length === 0) {
        return;
    }

    const newNorm: Vec3D = collisions[0].collision.normal;
    const newPt: Vec3D = collisions[0].collision.point.plus(newNorm.times(1));

    const collisions2 = collideRay(SCENE, newPt, newNorm);
    const res = newNorm;
    // const res = (collisions2.length === 0)
    //     ? "NO"
    //     : collisions2[0].circle.center;

    console.log(
        // cast(SCENE, pt, dir),
        collisions[0].circle.center,
        res
    );
});