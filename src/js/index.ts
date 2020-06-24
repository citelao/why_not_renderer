console.log("Loading renderer!");

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

const WIDTH = 40;
const HEIGHT = 60;
const imageData = ctx.createImageData(WIDTH, HEIGHT);
const data = imageData.data;

type Pos = {
    x: number;
    y: number;
}

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

setPixel(data, { x: 10, y: 4}, { r: 255, g: 150, b: 100});
setPixel(data, { x: 15, y: 24}, { r: 255, g: 150, b: 100});
ctx.putImageData(imageData, 0, 0);