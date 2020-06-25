import Vec3D from "./Vec3D";

export default class Ray3D {
    public readonly pt: Vec3D;
    public readonly dir: Vec3D;

    public static Create({pt, dir}: {pt: Vec3D, dir: Vec3D}): Ray3D {
        return new Ray3D(pt, dir);
    }

    constructor(pt: Vec3D, dir: Vec3D) {
        this.pt = pt;
        this.dir = dir;
    }
}