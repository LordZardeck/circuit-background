export const CELL_SIZE = 15;
export const WIRE_LENGTH = 20;
export const CUT_OFF_LENGTH = 5;
export const STRAIGHTNESS = 5;

export const DIRECTION_MODIFIER = {
    CLAMP: 8,
    INVERSE: 4,
    STRAIGHT: 0,
    LEFT: -1,
    RIGHT: 1
};

export const CARDINAL_DIRECTIONS = {
    NORTH_WEST: 0,
    NORTH: 1,
    NORTH_EAST: 2,
    EAST: 3,
    SOUTH_EAST: 4,
    SOUTH: 5,
    SOUTH_WEST: 6,
    WEST: 7
};

export const DIRECTIONS = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0]
];

export function clampDirection(direction) {
    if (direction < CARDINAL_DIRECTIONS.NORTH_WEST) return direction + DIRECTION_MODIFIER.CLAMP;
    if (direction > CARDINAL_DIRECTIONS.WEST) return direction - DIRECTION_MODIFIER.CLAMP;

    return direction;
}