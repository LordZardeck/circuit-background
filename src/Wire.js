import {shuffle} from 'lodash';
import {
    CARDINAL_DIRECTIONS,
    CELL_SIZE, clampDirection, CUT_OFF_LENGTH, DIRECTION_MODIFIER,
    DIRECTIONS,
    STRAIGHTNESS,
    WIRE_LENGTH
} from './constants';

const animationRange = 3;

const standardColor = [169, 169, 169];
const animatedColor = [221, 202, 160];

export default class Wire {
    cells = [];
    start;
    pcb;
    nextDirection = CARDINAL_DIRECTIONS.NORTH_WEST;
    preferredDirection;

    constructor(pcb, start, preferredDirection) {
        this.start = start;
        this.pcb = pcb;
        this.preferredDirection = preferredDirection;
        this.animationProgress = false;
    }

    render(sketch) {
        if (!this.preferredDirection && this.cells.length < CUT_OFF_LENGTH) {
            return;
        }

        if (this.animationProgress === false) {
            if ((Math.floor(Math.random() * 100)) < 5) this.animationProgress = -animationRange;
        } else if (this.animationProgress > this.cells.length) {
            this.animationProgress = false;
        } else {
            this.animationProgress += sketch.deltaTime / 75;
        }

        sketch.noFill();
        sketch.stroke.apply(sketch, standardColor);
        sketch.strokeWeight(CELL_SIZE / 4);
        sketch.beginShape();

        let isAnimating = false;

        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];
            const isNowAnimating = this.animationProgress !== false && (i > this.animationProgress && i < this.animationProgress + animationRange);

            if (!isAnimating && isNowAnimating) {
                sketch.vertex((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
                sketch.endShape();
                sketch.stroke.apply(sketch, animatedColor);
                sketch.beginShape();
            }

            if (isAnimating && !isNowAnimating) {
                sketch.vertex((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
                sketch.endShape()
                sketch.stroke.apply(sketch, standardColor);
                sketch.beginShape();
            }

            sketch.vertex((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
            isAnimating = isNowAnimating;
        }

        sketch.endShape();
        sketch.fill(26, 26, 26);
        sketch.strokeWeight(CELL_SIZE / 6);

        const end = this.cells.length - 1;

        sketch.stroke.apply(sketch, this.animationProgress !== false && (0 > this.animationProgress && 0 < this.animationProgress + animationRange) ? animatedColor : standardColor);
        sketch.ellipse((this.cells[0].x + .5) * CELL_SIZE, (this.cells[0].y + .5) * CELL_SIZE, CELL_SIZE * .7);

        sketch.stroke.apply(sketch, this.animationProgress !== false && (end > this.animationProgress && end < this.animationProgress + animationRange) ? animatedColor : standardColor);
        sketch.ellipse((this.cells[end].x + .5) * CELL_SIZE, (this.cells[end].y + .5) * CELL_SIZE, CELL_SIZE * .7);
    }

    addCellIfAvailable(previousCell, direction) {
        const [directionX, directionY] = DIRECTIONS[direction];

        const x = directionX + previousCell.x;
        const y = directionY + previousCell.y;

        if (this.pcb.isCellAvailable(x, y) && this.noCrossOver(direction, x, y)) {
            const cell = this.pcb.grid[x][y];
            cell.available = false;

            return cell;
        }

        return false;
    }

    generate() {
        this.nextDirection = this.findOpenDir();
        const startingCell = this.start;
        this.cells = new Array(WIRE_LENGTH);
        this.cells[0] = startingCell;
        let lastDirectionModifier = DIRECTION_MODIFIER.STRAIGHT;
        let timesDirectionHeld = 0;
        let timesDirectionChanged = 0;

        for (let cellIndex = 1; cellIndex < this.cells.length; cellIndex++) {
            const previousCell = this.cells[cellIndex - 1];

            if (previousCell === undefined) {
                break;
            }

            if (this.preferredDirection && cellIndex < 5) {
                const cell = this.addCellIfAvailable(previousCell, this.preferredDirection);

                if (cell === false) {
                    break;
                }

                this.cells[cellIndex] = cell;
                continue;
            }

            const potentialDirectionModifiers = [DIRECTION_MODIFIER.STRAIGHT, DIRECTION_MODIFIER.LEFT, DIRECTION_MODIFIER.RIGHT];

            while (potentialDirectionModifiers.length > 0 && timesDirectionChanged < 2) {
                let directionModifier = lastDirectionModifier;

                if (directionModifier === null || timesDirectionHeld >= 6) {
                    directionModifier = lastDirectionModifier = potentialDirectionModifiers.splice(Math.floor(Math.pow(Math.random(), STRAIGHTNESS) * potentialDirectionModifiers.length), 1)[0];
                    timesDirectionHeld = 0;
                }

                const directionIndex = clampDirection(this.nextDirection + directionModifier);
                const cell = this.addCellIfAvailable(previousCell, directionIndex);

                if (directionModifier !== DIRECTION_MODIFIER.STRAIGHT) {
                    timesDirectionChanged++;
                }

                if (cell !== false) {
                    this.cells[cellIndex] = cell;
                    this.nextDirection = directionIndex;
                    timesDirectionHeld++;

                    break;
                }

                lastDirectionModifier = null;
            }
        }

        this.cells = this.cells.filter(cell => cell !== undefined);

        if (!this.preferredDirection && this.cells.length < CUT_OFF_LENGTH) {
            this.cells.forEach(cell => cell.available = true);
            this.cells = [];
        }
    }

    noCrossOver(index, x, y) {
        if (index === CARDINAL_DIRECTIONS.NORTH_WEST) return (this.pcb.grid[x + 1][y].available || this.pcb.grid[x][y + 1].available);
        if (index === CARDINAL_DIRECTIONS.NORTH_EAST) return (this.pcb.grid[x - 1][y].available || this.pcb.grid[x][y + 1].available);
        if (index === CARDINAL_DIRECTIONS.SOUTH_EAST) return (this.pcb.grid[x - 1][y].available || this.pcb.grid[x][y - 1].available);
        if (index === CARDINAL_DIRECTIONS.SOUTH_WEST) return (this.pcb.grid[x + 1][y].available || this.pcb.grid[x][y - 1].available);
        return true;
    }

    findOpenDir() {
        return shuffle(Object.values(CARDINAL_DIRECTIONS))
            .find(directionIndex => this.pcb.isCellAvailable(this.start.x + DIRECTIONS[directionIndex][0], this.start.y + DIRECTIONS[directionIndex][1])) || 0;
    }
}