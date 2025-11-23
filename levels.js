// levels.js

const levels = [
    {
        name: "Level 1: The First Step",
        startPosition: [50 / 2, 50 / 2], // Start X/Y (Cell 0,0)
        goalPosition: [350 + (50 / 2), 350 + (50 / 2)], // Goal X/Y (Cell 7,7)
        initialDirection: 0, // 0=Right
        requiredBlocks: ["move_forward", "turn_right", "turn_left"], // Focus on basic movement
        instruction: "Use MOVE FORWARD blocks to reach the goal. It's 7 steps!"
    },
    {
        name: "Level 2: Looping the Corner",
        startPosition: [50 / 2, 50 / 2],
        goalPosition: [350 + (50 / 2), 50 / 2], // Goal is on the top edge (Cell 7,0)
        initialDirection: 1, // Start facing Down
        requiredBlocks: ["move_forward", "controls_repeat_ext"], // Focus on loops
        instruction: "Use the REPEAT block to move down and then right to the goal. You need to turn twice."
    }
    // You can add dozens more levels here!
];
