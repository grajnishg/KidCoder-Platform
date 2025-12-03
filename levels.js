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
    },
    {
        name: "Level 3: S-Turn Challenge",
        startPosition: [50 / 2, 50 / 2],
        goalPosition: [250 + (50 / 2), 150 + (50 / 2)], // Cell 5,3
        initialDirection: 0,
        requiredBlocks: ["move_forward", "turn_left", "turn_right"],
        instruction: "Navigate an S-turn! Use turns and moves to reach the goal."
    },
    {
        name: "Level 4: The Square Dance",
        startPosition: [50 / 2, 50 / 2],
        goalPosition: [50 / 2, 50 / 2], // Back to start after a loop
        initialDirection: 0,
        requiredBlocks: ["move_forward", "turn_right", "custom_repeat"],
        instruction: "Make a square! Use a REPEAT block to move forward 3 times and turn right, four times."
    },
    {
        name: "Level 5: Around the Block",
        startPosition: [50 / 2, 50 / 2], // Cell 0,0
        goalPosition: [300 + (50 / 2), 100 + (50 / 2)], // Cell 6,2
        initialDirection: 0,
        requiredBlocks: ["move_forward", "turn_left", "turn_right", "custom_repeat"],
        instruction: "Navigate around the obstacle. Try moving forward 3 steps, turning left, moving 2 steps, and then turning left again to reach the goal!"
    }
];
