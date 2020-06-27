export default class Point2D {
    public readonly x: number;
    public readonly y: number;

    public static Create({x, y}: { x: number; y: number; }): Point2D {
        return new Point2D(x, y);
    }

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}