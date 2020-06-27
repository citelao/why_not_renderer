import Color from "./Color";

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
        const HEADER_START = 0;
        const header = [
            dv.getUint8(HEADER_START),
            dv.getUint8(HEADER_START + 1)
        ];

        const pf = String.fromCharCode(... header);
        const EXPECTED_HEADER = "PF";
        if (pf !== EXPECTED_HEADER) {
            throw new Error(`PFM header not intact: is '${EXPECTED_HEADER}', got '${pf}'`);
        }
    }

    public get(x: number, y: number): Color {
        return {
            r: 50,
            g: 20,
            b: 30
        };
    }
}