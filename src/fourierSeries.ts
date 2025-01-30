import { add, complex, Complex, exp, multiply, pi } from "mathjs";
import { Path } from "./path";
import { Converter, Point } from "./point";

export class FourierSeries {
    coefficients: Complex[];
    indices: number[];
    nSamples: number;

    constructor(size: number, nSamples: number) {
        this.coefficients = new Array(size*2-1).fill(complex(0, 0));
        // indices are 0, 1, -1, 2, -2, 3, -3, ...
        this.indices = [0];
        for (let i = 1; i < size; i++) {
            this.indices.push(i);
            this.indices.push(-i);
        }
        this.nSamples = nSamples;
    }

    enumerate() {
        // return [{index1, coefficient1}, {index2, coefficient2}, ...]
        return this.indices.map((index, i) => {
            return {index, coefficient: this.coefficients[i]};
        });
    }

    computeCoefficients(path: Path, converter: Converter) {
        const parametricSamples = Array.from({length: this.nSamples}, (_, i) => path.pointAt(i / this.nSamples)).filter(p => p !== null) as Point[];
        const complexPoints = parametricSamples.map(converter.coordinatesToComplex.bind(converter));

        const I = complex(0, 1);

        // Calculate integrals and push c coefficients
        for (let j = 0; j < this.coefficients.length; j++) {
            var total = complex(0, 0);
            for (let k = 0; k < this.nSamples; k++) {
                const exp2 = exp(multiply(-1, I, 2, pi, this.indices[j], (k / this.nSamples)) as Complex);
                total = add(total, multiply(complexPoints[k], exp2, 1/this.nSamples)) as Complex;
            }
            this.coefficients[j] = total;
        }
    }

    getSeriesTerms(t: number): {index: number, coefficient: Complex, value: Complex}[] {
        const res: {index: number, coefficient: Complex, value: Complex}[] = [];
        const I = complex(0, 1); 
        for (let j = 0; j < this.indices.length; j++) {
            res.push({
                index: this.indices[j],
                coefficient: this.coefficients[j],
                value: multiply(this.coefficients[j], exp(multiply(this.indices[j], 2, pi, I, t) as Complex)) as Complex
            })
        }
        return res;
    }
}