import {shuffle} from 'lodash';
import {
    CARDINAL_DIRECTIONS,
    CELL_SIZE, clampDirection, CUT_OFF_LENGTH, DIRECTION_MODIFIER,
    DIRECTIONS,
    STRAIGHTNESS,
    WIRE_LENGTH
} from './constants';

const ANIMATION_RANGE = 3;

const standardColor = 'rgb(169, 169, 169)';
const animatedColor = 'rgb(221, 202, 160)';

export default class Wire {
    cells = [];
    start;
    pcb;
    nextDirection = CARDINAL_DIRECTIONS.NORTH_WEST;
    preferredDirection;
    path;
    redraw = true;

    constructor(pcb, start, preferredDirection) {
        this.start = start;
        this.pcb = pcb;
        this.preferredDirection = preferredDirection;
        this.animationProgress = false;
    }

    static setupStaticLinesContext(context) {
        context.fillStyle = 'rgba(0,0,0,0)';
        context.strokeStyle = standardColor;
        context.lineWidth = CELL_SIZE / 4;
    }

    static setupAnimatedLinesContext(context) {
        context.strokeStyle = animatedColor;
    }

    static setupPathEndsContext(context) {
        context.fillStyle = 'rgb(26, 26, 26)';
        context.lineWidth = CELL_SIZE / 6;
    }

    static setupStaticPathEndContext(context) {
        context.strokeStyle = standardColor;
    }

    static setupAnimatedPathEndContext(context) {
        context.strokeStyle = animatedColor;
    }

    get shouldRender() {
        return this.preferredDirection || this.cells.length >= CUT_OFF_LENGTH;
    }

    renderStaticLines(context) {
        if (this.path !== undefined && this.redraw) {
            context.stroke(this.path);
        }
    }

    renderAnimatedLines(context) {
        if (this.animationProgress !== false) {
            let hasMoved = false;
            context.beginPath();

            for (let i = Math.max(0, Math.floor(this.animationProgress)); i < Math.min(this.cells.length, Math.floor(this.animationProgress) + ANIMATION_RANGE); i++) {
                const cell = this.cells[i];

                if (!hasMoved) {
                    context.moveTo((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
                    hasMoved = true;
                    continue;
                }

                context.lineTo((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
            }

            context.stroke();
            this.redraw = true;
        }
    }

    renderPathEnd(context, cell) {
        if (this.redraw) {
            context.beginPath();
            context.arc((this.cells[cell].x + .5) * CELL_SIZE, (this.cells[cell].y + .5) * CELL_SIZE, (CELL_SIZE * .7) / 2, 0, 2 * Math.PI);
            context.fill();
            context.stroke();
        }
    }

    getPathEndRenderers(context) {
        let animatedEnds = [], staticEnds = [];

        if (this.redraw) {
            (this.animationProgress !== false && (0 > this.animationProgress && 0 < this.animationProgress + ANIMATION_RANGE) ? animatedEnds : staticEnds).push(() => this.renderPathEnd(context, 0));

            const end = this.cells.length - 1;
            (this.animationProgress !== false && (end > this.animationProgress && end < this.animationProgress + ANIMATION_RANGE) ? animatedEnds : staticEnds).push(() => this.renderPathEnd(context, end));
        }

        return [staticEnds, animatedEnds];
    }

    prepareRender(context, delta) {
        if (this.animationProgress === false) {
            if ((Math.random() * 100) < 0.02) this.animationProgress = -ANIMATION_RANGE;
        } else if (this.animationProgress > this.cells.length) {
            this.animationProgress = false;
        } else {
            this.animationProgress += delta / 50;
        }

        if (this.animationProgress !== false) {
            this.redraw = true;
        }
        // const end = this.cells.length - 1;
        //
        // context.strokeStyle = this.animationProgress !== false && (0 > this.animationProgress && 0 < this.animationProgress + ANIMATION_RANGE) ? animatedColor : standardColor;
        // context.beginPath();
        // context.arc((this.cells[0].x + .5) * CELL_SIZE, (this.cells[0].y + .5) * CELL_SIZE, (CELL_SIZE * .7) / 2, 0, 2 * Math.PI);
        // context.fill();
        // context.stroke();
        //
        // context.strokeStyle = this.animationProgress !== false && (end > this.animationProgress && end < this.animationProgress + ANIMATION_RANGE) ? animatedColor : standardColor;
        // context.beginPath();
        // context.arc((this.cells[end].x + .5) * CELL_SIZE, (this.cells[end].y + .5) * CELL_SIZE, (CELL_SIZE * .7) / 2, 0, 2 * Math.PI);
        // context.fill();
        // context.stroke();
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

            return;
        }

        this.createPath();
    }

    createPath() {
        this.path = new Path2D();

        for (let i = 0; i < this.cells.length; i++) {
            const cell = this.cells[i];

            if (i === 0) {
                this.path.moveTo((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
                continue;
            }

            this.path.lineTo((cell.x + .5) * CELL_SIZE, (cell.y + .5) * CELL_SIZE);
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