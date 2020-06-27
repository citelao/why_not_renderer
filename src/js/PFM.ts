import Color, { COLOR_MAX } from "./Color";

type Endianness = "little" | "big";

/**
 * Class for reading PFM files.
 *
 * Most of the behavior derived from
 * http://www.pauldebevec.com/Research/HDR/PFM/.
 */
export default class PFM {
    public static async Fetch(url: string) {
        const resp = await fetch(url);
        const buffer = await resp.arrayBuffer();
        return new PFM(buffer);
    }

    public readonly height: number;
    public readonly width: number;
    public readonly endianness: Endianness;
    private readonly data: DataView;

    constructor(buffer: ArrayBuffer) {
        // buffer.
        console.log("PFM! PFM!");
        const dv = new DataView(buffer);

        // Verify header!
        //
        // Assume a header max of 256. There should be three line breaks within
        // it. If there are not, then the header is longer. That is acceptable,
        // but let's not deal with it yet. 256 should be more than plenty.
        const MAX_HEADER_LENGTH = 256;

        const expectedHeader = new Uint8Array(buffer, 0, MAX_HEADER_LENGTH);
        const headerString = String.fromCharCode(... expectedHeader);

        const PFM_NEWLINE = String.fromCharCode(0x0a);
        const headerLines = headerString.split(PFM_NEWLINE);

        if (headerLines.length < 3) {
            throw new Error(`PFM header longer than ${MAX_HEADER_LENGTH} bytes`);
        }

        const pf = headerLines[0];
        const EXPECTED_HEADER = "PF";
        if (pf !== EXPECTED_HEADER) {
            throw new Error(`PFM header not intact: is '${EXPECTED_HEADER}', got '${pf}'`);
        }

        const rawDimensions = headerLines[1].split(" ");
        if (rawDimensions.length !== 2) {
            throw new Error(`Expected 2 dimensions, got ${rawDimensions.length}`);
        }
        const dimensions = rawDimensions.map((s) => parseInt(s, 10));
        console.log(dimensions);

        // X first, then y.
        this.height = dimensions[1];
        this.width = dimensions[0];

        const endianNumber = parseFloat(headerLines[2]);
        this.endianness = (endianNumber < 0)
            ? "little"
            : "big";

        console.log(`Endianness: ${this.endianness}`);

        const firstNewLine = headerString.indexOf(PFM_NEWLINE);
        const secondNewLine = headerString.indexOf(PFM_NEWLINE, firstNewLine + 1);
        const thirdNewLine = headerString.indexOf(PFM_NEWLINE, secondNewLine + 1);
        console.log([
            firstNewLine,
            secondNewLine,
            thirdNewLine
        ]);

        const dataStartIndex = thirdNewLine + 1;
        this.data = new DataView(buffer, dataStartIndex);
    }

    public get(x: number, y: number): Color {
        const BYTES_PER_FLOAT = 4;
        const FLOATS_PER_PIXEL = 3;
        const p = {
            x: Math.round(x),
            y: Math.round(y)
        } 
        const offset = (p.x + p.y * this.width) * BYTES_PER_FLOAT * FLOATS_PER_PIXEL;

        if (offset > this.data.byteLength) {
            throw new Error(`Out of bounds! [${p.x}, ${p.y}] (${offset}) for [${this.width}, ${this.height}] (${this.data.byteLength})`);
        }

        const isLittleEndian = this.endianness === "little";

        return {
            r: this.data.getFloat32(offset, isLittleEndian) * COLOR_MAX,
            g: this.data.getFloat32(offset + 1 * BYTES_PER_FLOAT, isLittleEndian) * COLOR_MAX,
            b: this.data.getFloat32(offset + 2 * BYTES_PER_FLOAT, isLittleEndian) * COLOR_MAX
        }

        return {
            r: 50,
            g: 20,
            b: 30
        };
    }
}