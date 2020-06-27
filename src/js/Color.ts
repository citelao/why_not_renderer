export const COLOR_MAX = 255;
export default interface Color {
    r: number;
    g: number;
    b: number;
    a?: number;
}

export const WHITE: Color = {
    r: COLOR_MAX,
    g: COLOR_MAX,
    b: COLOR_MAX
};

export const BLACK: Color = {
    r: 0,
    g: 0,
    b: 0
};

export const RED: Color = {
    r: COLOR_MAX,
    g: 0,
    b: 0
};

export const GREEN: Color = {
    r: 0,
    g: COLOR_MAX,
    b: 0
};
