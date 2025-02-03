import './style.css'
import { AnimationParams, FourierAnimation } from '.';
import defaultSvg from './assets/fourier.svg';

let animation: FourierAnimation | null = null;

window.onload = () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    animation = new FourierAnimation(canvas);
    window.addEventListener('resize', () => animation?.resizeCanvas(window.innerHeight, window.innerWidth));
    animation.resizeCanvas(window.innerHeight, window.innerWidth);
    function animate() {
        animation?.renderFrame();
        requestAnimationFrame(animate);
    }
    animate();
}
