import PFM from "./PFM";
import Vec3D from "./Vec3D";
import Point2D from "./Point2D";

export default class Lightmap {
    private readonly image: PFM;

    constructor(image: PFM) {
        this.image = image;
    }

    public get(dir: Vec3D) {
        // TODO: assume normalized.

        // Lightmaps are completely independent of position and rely only on
        // direction.

        const center = Point2D.Create({
            x: this.image.width / 2,
            y: this.image.height / 2
        });

        // This works for double width images on the horizontal plane, somehow.
        // const loc = Point2D.Create({
        //     x: center.x + (dir.x * ((this.image.width - 1) / 2)),
        //     y: center.y + (dir.y * ((this.image.height - 1) / 2))
        // });
        const loc = Point2D.Create({
            x: center.x + (dir.x * ((this.image.width - 1) / 4)),
            y: center.y + (dir.y * ((this.image.height - 1) / 4))
        });

        return this.image.get(loc.x, loc.y);
    }
}