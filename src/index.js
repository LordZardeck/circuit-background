/**
 * Inspired by and built off of: https://codepen.io/tsuhre/pen/xgmEPe
 */

import * as p5 from 'p5';
import PCB from './PCB';
import {CELL_SIZE} from './constants';
import {debounce} from 'lodash';

const P5 = new p5(
    sketch => {
        const pcb = new PCB();

        sketch.setup = () => {
            sketch.createCanvas();
            sketch.ellipseMode(sketch.CENTER);
            sketch.colorMode(sketch.RGB);
            pcb.resize(sketch);
        };

        sketch.draw = () => {
            sketch.background(26, 26, 26);
            pcb.draw(sketch);
            // sketch.fill(255, 255, 255);
            // sketch.text(sketch.deltaTime, sketch.width / 2, sketch.height / 2);

            // sketch.noFill();
            // sketch.strokeWeight(CELL_SIZE / 4);
            // sketch.stroke.apply(sketch, (Math.random() * 100) > 20 ? [169, 169, 169] : [221, 202, 160]);
            //
            // sketch.beginShape();
            //
            // for (let i = 0; i < 5; i++) {
            //     sketch.vertex((20 + .5) * CELL_SIZE, ((20 - i) + .5) * CELL_SIZE);
            // }
            //
            // sketch.endShape();
            //
            // sketch.fill(26, 26, 26);
            // sketch.strokeWeight(CELL_SIZE / 6);
            // sketch.ellipse((20 + .5) * CELL_SIZE, (16 + .5) * CELL_SIZE, CELL_SIZE * .7);
            //
            // sketch.fill(32, 39, 65);
            // sketch.square(20 * CELL_SIZE, 20 * CELL_SIZE, 20 * CELL_SIZE);

            // sketch.noLoop();
        };

        window.addEventListener('resize', debounce(() => pcb.resize(sketch), 100), false);
    },
    document.getElementById('canvas-background')
)

