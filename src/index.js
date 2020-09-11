/**
 * Inspired by and built off of: https://codepen.io/tsuhre/pen/xgmEPe
 */

import * as p5 from 'p5';
import PCB from './PCB';
import {debounce} from 'lodash';

window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas-background');
    const context = canvas.getContext('2d');

    const pcb = new PCB();
    pcb.resize(canvas);

    let start = Date.now();

    const draw = timestamp => {
        const elapsed = timestamp - start;

        requestAnimationFrame(draw);

        // context.fillStyle = "rgb(26, 26, 26)";
        // context.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        pcb.draw(context, canvas, elapsed);

        start = timestamp;
    };

    requestAnimationFrame(draw);

    window.addEventListener('resize', debounce(() => pcb.resize(canvas), 100), false);
});
