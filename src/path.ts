import { CommandM, SVGPathData } from "svg-pathdata";
import { Point } from "./point";

export interface PathSegment {
    start: Point;
    end: Point;

    pointAt(t: number): Point;

    // Assumes context at start of curve, don't use start point
    draw(ctx: CanvasRenderingContext2D): void;
}

export class LinearSegment implements PathSegment {
    start: Point;
    end: Point;

    constructor(start: Point, end: Point) {
        this.start = start;
        this.end = end;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.lineTo(this.end.x, this.end.y);
    }

    pointAt(t: number): Point {
        return {
            x: this.start.x + t * (this.end.x - this.start.x),
            y: this.start.y + t * (this.end.y - this.start.y)
        }
    }
}

export class QuadraticBezierSegment implements PathSegment {
    start: Point;
    control: Point;
    end: Point;

    constructor(start: Point, control: Point, end: Point) {
        this.start = start;
        this.control = control;
        this.end = end;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.bezierCurveTo(
            this.control.x, this.control.y,
            this.control.x, this.control.y,
            this.end.x, this.end.y
        )
    }

    pointAt(t: number): Point {
        const a = (1 - t) ** 2;
        const b = 2 * (1 - t) * t;
        const c = t ** 2;
        return {
            x: a * this.start.x + b * this.control.x + c * this.end.x,
            y: a * this.start.y + b * this.control.y + c * this.end.y
        }
    }
}

export class CubicBezierSegment implements PathSegment {
    start: Point;
    control1: Point;
    control2: Point;
    end: Point;

    constructor(start: Point, control1: Point, control2: Point, end: Point) {
        this.start = start;
        this.control1 = control1;
        this.control2 = control2;
        this.end = end;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.bezierCurveTo(
            this.control1.x, this.control1.y,
            this.control2.x, this.control2.y,
            this.end.x, this.end.y
        )
    }

    pointAt(t: number): Point {
        const a = (1 - t) ** 3;
        const b = 3 * (1 - t) ** 2 * t;
        const c = 3 * (1 - t) * t ** 2;
        const d = t ** 3;
        return {
            x: a * this.start.x + b * this.control1.x + c * this.control2.x + d * this.end.x,
            y: a * this.start.y + b * this.control1.y + c * this.control2.y + d * this.end.y
        }
    }
}

export class Path {
    segments: PathSegment[];
    constructor() {
        this.segments = [];
    }

    addSegment(segment: PathSegment) {
        this.segments.push(segment);
    }

    clear() {
        this.segments = [];
    }

    static fromSVGPathData(path: string): Path {
        const pathData = new SVGPathData(path).toAbs();
        const pathObj = new Path();

        let prevPoint: Point = pathData.commands[0] as CommandM;
        for (const command of pathData.commands) {
            switch (command.type) {
                case SVGPathData.MOVE_TO:
                    break;
                case SVGPathData.LINE_TO:
                    pathObj.addSegment(new LinearSegment(prevPoint, {x: command.x, y: command.y}));
                    prevPoint = {x: command.x, y: command.y};
                    break;
                case SVGPathData.CURVE_TO:
                    pathObj.addSegment(new CubicBezierSegment(prevPoint, {x: command.x1, y: command.y1}, {x: command.x2, y: command.y2}, {x: command.x, y: command.y}));
                    prevPoint = {x: command.x, y: command.y};
                    break;
                default:
                    console.warn(`Unsupported path segment type ${command.type}`);
            }
        }
        return pathObj;
    }

    pointAt(t: number): Point | null {
        // Black magic as far as I'm concerned
        const n = this.segments.length;
        if (!((t *= n) >= t)) return null;
        const i = Math.max(0, Math.min(n - 1, Math.floor(t)));
        return this.segments[i].pointAt(t % 1);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.moveTo(this.segments[0].start.x, this.segments[0].start.y);
        for (let s of this.segments) {
            s.draw(ctx);
        }
    }
}