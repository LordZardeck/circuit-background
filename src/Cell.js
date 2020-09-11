import {CELL_SIZE} from './constants';

export default class Cell {
    x = 0;
    y = 0;
    available = true;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // get boundingRect() {
    //     return {
    //         left: this.x * CELL_SIZE,
    //         right: (this.x * CELL_SIZE) + CELL_SIZE,
    //         top: this.y * CELL_SIZE,
    //         bottom: (this.y * CELL_SIZE) + CELL_SIZE
    //     }
    // }
}