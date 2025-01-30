import { add, Complex, complex, pi, sqrt } from "mathjs";
import { FourierSeries } from "./fourierSeries";
import { CubicBezierSegment, LinearSegment, Path } from "./path";
import { Converter, Point } from "./point";

export interface AnimationParams {
    unitFactor: number; // Units per canvas width
    seriesSize: number; // Number of terms in the Fourier series
    historyLength: number; // Number of points to keep in the history
    nSamples: number; // Number of samples to take for the Fourier series
    speed: number // Speed of the animation
}

export class FourierAnimation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    animationParams: AnimationParams;
    converter: Converter;
    drawingParser: DrawingParser;

    startTime: number;

    path: Path;
    fourierSeries: FourierSeries;

    pointHistory: Point[];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = context;
        this.startTime = Date.now();
        this.animationParams = {
            unitFactor: 5,
            seriesSize: 30,
            historyLength: 10,
            nSamples: 100,
            speed: 20
        }
        this.fourierSeries = new FourierSeries(this.animationParams.seriesSize, this.animationParams.nSamples);
        this.converter = new Converter(this.canvas, this.animationParams.unitFactor);
        this.pointHistory = [];
        this.drawingParser = new DrawingParser(this.setPath.bind(this));
        this.drawingParser.registerEvents(this.canvas);
        // Start with a simple path using bezier and linear curves
        this.path = new Path();
        this.path.addSegment(new CubicBezierSegment(
            {x: 100, y: 100},
            {x: 150, y: 200},
            {x: 200, y: 150},
            {x: 200, y: 100}
        ));
        this.path.addSegment(new LinearSegment(
            {x: 200, y: 200},
            {x: 100, y: 100}
        ));
        this.fourierSeries.computeCoefficients(this.path, this.converter);
    }

    public reset() {
        this.startTime = Date.now();
        // Wipe trail, recalculate coefficients, etc...
        this.pointHistory = [];

    }

    public updateParams(params: Partial<AnimationParams>) {
        this.animationParams = {...this.animationParams, ...params};
        this.converter = new Converter(this.canvas, this.animationParams.unitFactor);
        this.fourierSeries = new FourierSeries(this.animationParams.seriesSize, this.animationParams.nSamples);
        this.reset();
    }

    public resizeCanvas(height: number, width: number) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.fourierSeries.computeCoefficients(this.path, this.converter);
    }

    public renderFrame() {
        this.ctx.fillStyle = 'black';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawDrawing();
        this.drawPath();
        this.drawFourier();
    }

    public setPath(path: Path) {
        this.path = path;
        this.fourierSeries.computeCoefficients(this.path, this.converter);
        this.reset();
    }

    private drawPath() {
        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.path.draw(this.ctx);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private drawDrawing() {
        if (this.drawingParser.isDrawing) {
            this.ctx.strokeStyle = "red";
            this.ctx.beginPath();
            this.drawingParser.getPath().draw(this.ctx);
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    private drawFourier() {
        let point = complex(0, 0);
        let prevPoint = complex(0, 0);

        const t = (Date.now() - this.startTime) / 100000 * this.animationParams.speed;

        for (const {coefficient, value} of this.fourierSeries.getSeriesTerms(t)) {
            point = add(point, value) as Complex;
            this.ctx.strokeStyle = "red";
            this.ctx.lineWidth = 1;
            const prevCoords = this.converter.complexToCoordinates(prevPoint);
            const coords = this.converter.complexToCoordinates(point);
            this.ctx.beginPath();
            this.ctx.moveTo(prevCoords.x, prevCoords.y);
            this.ctx.lineTo(coords.x, coords.y);
            this.ctx.stroke();
            this.ctx.closePath();

            prevPoint = point;

            this.ctx.strokeStyle = "blue";
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(
                coords.x,
                coords.y,
                this.converter.scalarToPixels(sqrt(coefficient.re ** 2 + coefficient.im ** 2) as number),
                0,
                2 * pi,
                false
            );
            this.ctx.stroke();
            this.ctx.closePath();
        }
        // End point
        const coords = this.converter.complexToCoordinates(point)
        this.drawPoint(coords);

        // Save point history
        this.pointHistory.push(coords);
        this.pointHistory = this.pointHistory.slice(-this.animationParams.historyLength * this.animationParams.speed);

        // Draw point history
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.pointHistory[0].x, this.pointHistory[0].y);
        for (let i = 1; i < this.pointHistory.length; i++) {
            this.ctx.lineTo(this.pointHistory[i].x, this.pointHistory[i].y);
        }
        this.ctx.stroke();
    }

    private drawPoint(p: Point) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
    }

}

class DrawingParser {
    points: Point[];
    isDrawing: boolean;
    callback: (path: Path) => void;

    constructor(callback: (path: Path) => void) {
        this.points = [];
        this.isDrawing = false;
        this.callback = callback;
    }

    public registerEvents(element: HTMLElement) {
        element.addEventListener('mousedown', this.startDrawing.bind(this));
        element.addEventListener('mousemove', this.addPoint.bind(this));
        element.addEventListener('mouseup', this.stopDrawing.bind(this));
        element.addEventListener('mouseout', this.stopDrawing.bind(this));
    }

    startDrawing(e: MouseEvent) {
        this.points = [{x: e.offsetX, y: e.offsetY}];
        this.isDrawing = true;
    }

    addPoint(e: MouseEvent) {
        if (this.isDrawing) {
            this.points.push({x: e.offsetX, y: e.offsetY});
        }
    }

    stopDrawing() {
        this.isDrawing = false;
        this.callback(this.getPath());
    }

    getPath() {
        const path = new Path();
        for (let i = 1; i < this.points.length - 2; i += 3) {
            const start = this.points[i - 1];
            const control1 = this.points[i];
            const control2 = this.points[i + 1];
            const end = this.points[i + 2];
            path.addSegment(new CubicBezierSegment(start, control1, control2, end));
        }
        // Automatically close the path
        path.addSegment(new LinearSegment(this.points[this.points.length - 1], this.points[0]));
        return path;
    }
}