import { complex, Complex } from "mathjs";

export interface Point {
    x: number;
    y: number;
}

export class Converter {
    canvas: HTMLCanvasElement;
    unitFactor: number;

    constructor(canvas: HTMLCanvasElement, unitFactor: number) {
        this.canvas = canvas;
        this.unitFactor = unitFactor;
    }

    private canvasWidth(): number {
        return this.canvas.width;
    }

    private canvasHeight(): number {
        return this.canvas.height;
    }

    public coordinatesToComplex(point: Point): Complex {
        const centerX = this.canvasWidth() / 2;
        const centerY = this.canvasHeight() / 2;
        // const re = (point.x - centerX) * this.unitFactor / this.canvasWidth();
        const re = (point.x - centerX) * this.unitFactor / this.canvasWidth();
        const im = (centerY - point.y) * this.unitFactor / this.canvasWidth();
        return complex(re, im);
    }

    public complexToCoordinates(c: Complex): Point {
        const centerX = this.canvasWidth() / 2;
        const centerY = this.canvasHeight() / 2;
        // x = centerX + (canvas.width / unitFactor) * c.re
        // y = centerY - (canvas.height / unitFactor) * c.im
        const re = centerX + c.re * (this.canvasWidth() / this.unitFactor);
        const im = centerY - c.im * (this.canvasWidth() / this.unitFactor);
        return { x: re, y: im };
    }

    public scalarToPixels(s: number): number {
        return s * (this.canvasWidth() / this.unitFactor);
    }
}
