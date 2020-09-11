import {
    CARDINAL_DIRECTIONS, CELL_SIZE,
    clampDirection, CUT_OFF_LENGTH,
    DIRECTION_MODIFIER,
    DIRECTIONS,
    STRAIGHTNESS,
    WIRE_LENGTH
} from './constants';
import {shuffle} from 'lodash';

export default class Chip {
    cells = [];
    width;
    height;
    pcb;
    nextDirection = CARDINAL_DIRECTIONS.EAST;
    minX;
    maxX;
    minY;
    maxY;

    constructor(pcb, start, width, height) {
        this.width = width;
        this.height = height;
        this.pcb = pcb;
        this.nextDirection = this.findOpenDir(start.x, start.y);
    }

    render(sketch) {
        sketch.fill(14, 29, 48);
        sketch.strokeWeight(CELL_SIZE / 4);
        sketch.stroke(221, 202, 160);

        sketch.rect((this.minX + 0.5) * CELL_SIZE, (this.minY + 0.5) * CELL_SIZE, (this.maxX - this.minX) * CELL_SIZE, (this.maxY - this.minY) * CELL_SIZE);
    }

    generate(startingCell) {
        this.cells = new Array(this.width * this.height);
        this.cells[0] = startingCell;

        startingCell.available = false;
        let totalIndex = 1;

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (x === 0 && y === 0) continue;

                const cell = this.pcb.grid[startingCell.x + x][startingCell.y + y];

                if(!cell.available) throw new Error("Can't create chip in this area");

                cell.available = false;
                this.cells[totalIndex++] = cell;
            }
        }

        this.minX = this.cells[0].x;
        this.minY = this.cells[0].y;
        this.maxX = this.cells[0].x;
        this.maxY = this.cells[0].y;

        for (let i = 0; i < this.cells.length; i++) {
            const {x, y} = this.cells[i];

            this.minX = Math.min(this.minX, x);
            this.maxX = Math.max(this.maxX, x);
            this.minY = Math.min(this.minY, y);
            this.maxY = Math.max(this.maxY, y);
        }
    }

    noCrossOver(index, x, y) {
        if (index === CARDINAL_DIRECTIONS.NORTH_WEST) return (this.pcb.grid[x + 1][y].available || this.pcb.grid[x][y + 1].available);
        if (index === CARDINAL_DIRECTIONS.NORTH_EAST) return (this.pcb.grid[x - 1][y].available || this.pcb.grid[x][y + 1].available);
        if (index === CARDINAL_DIRECTIONS.SOUTH_EAST) return (this.pcb.grid[x - 1][y].available || this.pcb.grid[x][y - 1].available);
        if (index === CARDINAL_DIRECTIONS.SOUTH_WEST) return (this.pcb.grid[x + 1][y].available || this.pcb.grid[x][y - 1].available);
        return true;
    }

    findOpenDir(startX, startY) {
        return shuffle([CARDINAL_DIRECTIONS.NORTH, CARDINAL_DIRECTIONS.EAST, CARDINAL_DIRECTIONS.SOUTH, CARDINAL_DIRECTIONS.WEST])
            .find(directionIndex => this.pcb.isCellAvailable(startX + DIRECTIONS[directionIndex][0], startY + DIRECTIONS[directionIndex][1])) || 0;
    }
}