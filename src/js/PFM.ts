import Color from "./Color";

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

        const endianNumber = parseFloat(headerLines[2]);
        const endianness = (endianNumber < 0)
            ? "little"
            : "big";

        console.log(`Endianness: ${endianness}`);
    }

    public get(x: number, y: number): Color {
        return {
            r: 50,
            g: 20,
            b: 30
        };
    }
}