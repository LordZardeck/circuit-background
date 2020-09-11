import Cell from './Cell';
import Wire from './Wire';
import {inRange, shuffle, intersection} from 'lodash';
import {CARDINAL_DIRECTIONS, CELL_SIZE, CUT_OFF_LENGTH} from './constants';
import Chip from './Chip';

let times = [];

export default class PCB {
    grid = [];
    available = [];
    wires = [];
    chips = [];

    gridWidth;
    gridHeight;

    debug = false;

    draw(context, canvas, delta) {
        const wiresToRender = this.wires.filter(wire => wire.shouldRender);

        wiresToRender.forEach(wire => wire.prepareRender(context, delta));
        Wire.setupStaticLinesContext(context);
        wiresToRender.forEach(wire => wire.renderStaticLines(context));
        Wire.setupAnimatedLinesContext(context);
        wiresToRender.forEach(wire => wire.renderAnimatedLines(context));
        Wire.setupPathEndsContext(context);
        // wiresToRender.forEach(wire => wire.renderPathEnd(context, 0));
        const [staticEnds, animatedEnds] = wiresToRender.reduce(([staticEnds, animatedEnds], wire) => {
            const [newStaticEnds, newAnimatedEnds] = wire.getPathEndRenderers(context);

            return [
                [...staticEnds, ...newStaticEnds],
                [...animatedEnds, ...newAnimatedEnds],
            ]
        }, [[], []]);
        Wire.setupStaticPathEndContext(context);
        staticEnds.forEach(render => render());
        Wire.setupAnimatedLinesContext(context);
        animatedEnds.forEach(render => render());
        wiresToRender.forEach(wire => wire.redraw = false);
        this.chips.forEach(chip => chip.render(context, canvas, delta));

        // if (this.debug) {
        //     sketch.fill(0, 0, 0, 0);
        //     sketch.stroke(0, 0, 0, 50);
        //     this.grid.forEach(row => row.forEach(cell => {
        //         sketch.square((cell.x) * CELL_SIZE, (cell.y) * CELL_SIZE, CELL_SIZE);
        //     }));
        // }
    }

    resize(canvas) {
        canvas.width = document.body.scrollWidth;
        canvas.height = document.body.scrollHeight;
        this.recreate(document.body.scrollWidth, document.body.scrollHeight);
    }

    cellOverlapsUI(cell) {
        let boundingRect = {
            left: cell.x * CELL_SIZE,
            right: (cell.x * CELL_SIZE) + CELL_SIZE,
            top: cell.y * CELL_SIZE,
            bottom: (cell.y * CELL_SIZE) + CELL_SIZE
        };

        for (let index = 0; index < this.cutouts.length; index++) {
            const rect = this.cutouts[index];

            if ((boundingRect.left + CELL_SIZE) >= rect.left && (boundingRect.left - CELL_SIZE) < rect.right &&
                (boundingRect.top + (CELL_SIZE * 2)) >= rect.top && (boundingRect.top - CELL_SIZE) < rect.bottom) {
                return true;
            }
        }

        return false;
    }

    createGrid() {
        this.grid = new Array(this.gridWidth);
        this.available = new Array(this.gridHeight * this.gridWidth);

        for (let xIndex = 0; xIndex < this.grid.length; xIndex++) {
            const yCells = new Array(this.gridHeight);

            for (let yIndex = 0; yIndex < yCells.length; yIndex++) {
                const cell = {x: xIndex, y: yIndex, available: true};

                cell.available = !this.cellOverlapsUI(cell);

                if (cell.available) {
                    this.available[(xIndex * this.grid.length) + yIndex] = cell;
                }

                yCells[yIndex] = cell;
            }

            this.grid[xIndex] = yCells;
        }
    }

    createWires() {
        this.available = shuffle(this.available.filter(cell => cell !== undefined));
        this.available.forEach(availableCell => {
            if (!availableCell.available) return;

            availableCell.available = false;

            const wire = new Wire(this, availableCell);
            wire.generate();
            this.wires.push(wire);
        });
    }

    createChip(width, height) {
        this.available = shuffle(this.available.filter(cell => cell !== undefined));
        let chip;

        for (let index = 0; index < this.available.length; index++) {
            const availableCell = this.available[index];

            if (
                !availableCell.available ||
                availableCell.x + width > this.gridWidth ||
                availableCell.y + height > this.gridHeight
            ) continue;

            try {
                chip = new Chip(this, availableCell, width, height);
                chip.generate(availableCell);
                this.chips.push(chip);
            } catch (e) {
                chip.cells.forEach(cell => cell.available = true);
                continue;
            }

            break;
        }

        let wires = [];

        for(let x = chip.minX + 1; x < chip.maxX; x++) {
            wires.push(new Wire(this, this.grid[x][Math.max(0, chip.minY)], CARDINAL_DIRECTIONS.NORTH));
            wires.push(new Wire(this, this.grid[x][Math.min(this.gridHeight, chip.maxY)], CARDINAL_DIRECTIONS.SOUTH));
        }

        for(let y = chip.minY + 1; y < chip.maxY; y++) {
            wires.push(new Wire(this, this.grid[Math.max(0, chip.minX)][y], CARDINAL_DIRECTIONS.WEST));
            wires.push(new Wire(this, this.grid[Math.min(this.gridWidth, chip.maxX)][y], CARDINAL_DIRECTIONS.EAST));
        }

        wires.forEach(wire => wire.generate());

        this.wires = [...this.wires, ...wires];
    }

    recreate(width, height) {
        this.gridWidth = Math.ceil(width / CELL_SIZE) + 1;
        this.gridHeight = Math.ceil(height / CELL_SIZE) + 1;
        this.wires = [];
        this.chips = [];

        this.cutouts = Array.from(document.querySelectorAll('.cutout')).map(element => {
            const elementBoundingRect = element.getBoundingClientRect();

            return {
                top: elementBoundingRect.top + window.scrollY,
                bottom: elementBoundingRect.bottom + window.scrollY,
                right: elementBoundingRect.right + window.scrollX,
                left: elementBoundingRect.left + window.scrollX,
            }
        });

        this.createGrid();
        this.createChip(20, 20);
        this.createChip(20, 20);
        this.createChip(10, 30);
        this.createChip(10, 30);
        this.createChip(10, 30);
        this.createWires();
    }

    isCellAvailable(x, y) {
        return inRange(x, 0, this.gridWidth - 1) &&
            inRange(y, 0, this.gridHeight - 1) &&
            this.grid[x][y].available;
    }
}