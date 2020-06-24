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

function render(position: Pos): Color {
    return { r: position.x / WIDTH  * COLOR_MAX, g: 0, b: position.y / HEIGHT * COLOR_MAX };
}

repeat(WIDTH, (x) => {
    repeat(HEIGHT, (y) => {
        const pos: Pos = { x, y };
        setPixel(data, pos, render(pos));
    })
})

setPixel(data, { x: 10, y: 4}, { r: 255, g: 150, b: 100});
setPixel(data, { x: 15, y: 24}, { r: 255, g: 150, b: 100});

ctx.putImageData(imageData, 0, 0);