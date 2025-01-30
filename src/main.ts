import './style.css'
import { FourierAnimation } from '.';

window.onload = () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const animation = new FourierAnimation(canvas);
    window.addEventListener('resize', () => animation.resizeCanvas(window.innerHeight, window.innerWidth));
    animation.resizeCanvas(window.innerHeight, window.innerWidth);
    function animate() {
        animation.renderFrame();
        requestAnimationFrame(animate);
    }
    
    animate();
}
