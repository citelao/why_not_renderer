export type NormalizedVec3D = Vec3D | { normalized: true };

export default class Vec3D {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    public static Create({x, y, z}: {x: number, y: number, z: number}): Vec3D {
        return new Vec3D(x, y, z);
    }

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public magnitude(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    }

    public normalized(): NormalizedVec3D {
        const mag = this.magnitude();
        return new Vec3D(
            this.x / this.magnitude(),
            this.y / this.magnitude(),
            this.z / this.magnitude()
        );
    }

    public inverse(): Vec3D {
        return new Vec3D(
            - this.x,
            - this.y,
            - this.z
        );
    }

    public plus(other: Vec3D): Vec3D {
        return new Vec3D(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z
        );
    }

    public minus(other: Vec3D): Vec3D {
        return new Vec3D(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z
        );
    }

    public dot(other: Vec3D): number {
        return (this.x * other.x) +
            (this.y * other.y) +
            (this.z * other.z);
    }

    public times(n: number): Vec3D {
        return new Vec3D(
            this.x * n,
            this.y * n,
            this.z * n
        );
    }
}