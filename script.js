document.addEventListener('DOMContentLoaded', () => {

    // --- Custom Block Definitions ---
    Blockly.Blocks['move_forward'] = {
      init: function() {
        this.appendDummyInput().appendField("Move Forward");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Moves the character one step forward.");
      }
    };

    Blockly.Blocks['turn_left'] = {
      init: function() {
        this.appendDummyInput().appendField("Turn Left");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Turns the character 90 degrees left.");
      }
    };

    Blockly.Blocks['turn_right'] = {
      init: function() {
        this.appendDummyInput().appendField("Turn Right");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(290);
        this.setTooltip("Turns the character 90 degrees right.");
      }
    };

    Blockly.Blocks['if_front_is_clear'] = {
      init: function() {
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("If path in front is clear, then");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(120);
        this.setTooltip("Checks if the character can move forward without hitting a wall.");
      }
    };

    Blockly.Blocks['repeat_until'] = {
      init: function() {
        this.appendStatementInput("DO")
            .setCheck(null)
            .appendField("Repeat until goal is reached, then");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("Repeats the blocks inside until the character reaches the goal.");
      }
    };

    // --- Blockly Code Generators ---
    Blockly.JavaScript['move_forward'] = block => 'commands.push("move");\n';
    Blockly.JavaScript['turn_left'] = block => 'commands.push("turn_left");\n';
    Blockly.JavaScript['turn_right'] = block => 'commands.push("turn_right");\n';

    Blockly.JavaScript['controls_repeat_ext'] = function(block) {
      const repetitions = Blockly.JavaScript.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
      let branch = Blockly.JavaScript.statementToCode(block, 'DO');
      branch = Blockly.JavaScript.addLoopTrap(branch, block);
      const loopVar = Blockly.JavaScript.nameDB_.getReserveName('count', Blockly.Names.NameType.VARIABLE);
      return `for (let ${loopVar} = 0; ${loopVar} < ${repetitions}; ${loopVar}++) {\n${branch}}
`;
    };

    Blockly.JavaScript['if_front_is_clear'] = function(block) {
        const branch = Blockly.JavaScript.statementToCode(block, 'DO');
        return `commands.push({ type: 'if', code: () => { ${branch} } });\n`;
    };
    
    Blockly.JavaScript['repeat_until'] = function(block) {
        const branch = Blockly.JavaScript.statementToCode(block, 'DO');
        return `commands.push({ type: 'while', code: () => { ${branch} } });\n`;
    };

    // --- Global Game & State Variables ---
    let characterX, characterY, characterDirection, goalX, goalY;
    let commands = [];
    const cellSize = 50;
    const canvasSize = 400;
    let currentLevelIndex = 0;
    let currentLevel;
    let characterImg;

    // --- Blockly Workspace Initialization ---
    const workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        scrollbars: true,
        trashcan: true,
        zoom: { controls: true, wheel: true, startScale: 1.0 },
        grid: { spacing: 25, length: 3, colour: '#ccc', snap: true }
    });

    // --- Core Game Logic ---
    const isPathClear = () => {
        let nextX = characterX, nextY = characterY;
        if (characterDirection === 0) nextX += cellSize;
        else if (characterDirection === 1) nextY += cellSize;
        else if (characterDirection === 2) nextX -= cellSize;
        else if (characterDirection === 3) nextY -= cellSize;
        const minBound = cellSize / 2;
        const maxBound = canvasSize - (cellSize / 2);
        return (nextX >= minBound && nextX <= maxBound && nextY >= minBound && nextY <= maxBound);
    };

    // --- p5.js Sketch Definition ---
    const sketch = (p) => {
        p.preload = () => {
            characterImg = p.loadImage('assets/character.png');
        };

        p.setup = () => {
            const canvas = p.createCanvas(canvasSize, canvasSize);
            canvas.parent('game-container');
            loadLevel(currentLevelIndex);
            p.noLoop();
        };

        p.draw = () => {
            p.background(220); 
            drawGrid();
            drawGoal();
            drawCharacter();

            if (commands.length > 0) {
                const command = commands.shift();
                if (typeof command === 'string') {
                    switch (command) {
                        case 'move': moveCharacter(); break;
                        case 'turn_left': turnCharacter(-1); break;
                        case 'turn_right': turnCharacter(1); break;
                    }
                } else if (command.type === 'if' && isPathClear()) {
                    command.code();
                } else if (command.type === 'while' && (characterX !== goalX || characterY !== goalY)) {
                    command.code();
                    commands.unshift(command); // Re-insert loop
                }
                checkGoal();
            }
            if (commands.length === 0) p.noLoop();
        };

        const drawGrid = () => {
            p.stroke(200);
            for (let x = 0; x <= canvasSize; x += cellSize) p.line(x, 0, x, canvasSize);
            for (let y = 0; y <= canvasSize; y += cellSize) p.line(0, y, canvasSize, y);
        };

        const drawGoal = () => {
            p.fill(255, 165, 0); 
            p.rect(goalX - cellSize / 2, goalY - cellSize / 2, cellSize, cellSize);
            p.fill(255);
            p.textSize(16);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("GOAL", goalX, goalY);
        };

        const drawCharacter = () => {
            p.push();
            p.translate(characterX, characterY);
            p.rotate(p.radians(characterDirection * 90));
            p.imageMode(p.CENTER);
            p.image(characterImg, 0, 0, cellSize * 0.8, cellSize * 0.8);
            p.pop();
        };
        
        const moveCharacter = () => {
            if (characterDirection === 0) characterX += cellSize;
            else if (characterDirection === 1) characterY += cellSize;
            else if (characterDirection === 2) characterX -= cellSize;
            else if (characterDirection === 3) characterY -= cellSize;
            characterX = p.constrain(characterX, cellSize / 2, canvasSize - cellSize / 2);
            characterY = p.constrain(characterY, cellSize / 2, canvasSize - cellSize / 2);
        };

        const turnCharacter = (direction) => {
            characterDirection = (characterDirection + direction + 4) % 4;
        };

        const checkGoal = () => {
            if (characterX === goalX && characterY === goalY) {
                alert("🎉 Congratulations! Goal Reached!");
                p.noLoop();
            }
        };
        
        const loadLevel = (levelIndex) => {
            currentLevel = levels[levelIndex];
            characterX = currentLevel.startPosition[0];
            characterY = currentLevel.startPosition[1];
            characterDirection = currentLevel.initialDirection;
            goalX = currentLevel.goalPosition[0];
            goalY = currentLevel.goalPosition[1];
            document.getElementById('level-name').innerHTML = currentLevel.name;
            document.getElementById('level-instruction').innerHTML = currentLevel.instruction;
            workspace.clear();
            commands = [];
            if(p.isLooping()) p.noLoop();
            p.redraw();
        };

        // --- Expose Control Functions to Global Scope ---
        window.resetCharacter = () => {
            commands = [];
            characterX = currentLevel.startPosition[0];
            characterY = currentLevel.startPosition[1];
            characterDirection = currentLevel.initialDirection;
            if(p.isLooping()) p.noLoop();
            p.redraw();
        };

        window.resetAndRunCode = () => {
            window.resetCharacter();
            const code = Blockly.JavaScript.workspaceToCode(workspace);
            try {
                // The generated code now pushes functions to the command queue
                eval(code);
                if (commands.length > 0) p.loop();
            } catch (e) {
                console.error("Error executing blocks:", e);
                alert("Error executing blocks! Check the console.");
            }
        };

        window.nextLevel = () => {
            if (currentLevelIndex < levels.length - 1) {
                loadLevel(++currentLevelIndex);
            } else {
                alert("You've completed all the levels!");
            }
        };

        window.previousLevel = () => {
            if (currentLevelIndex > 0) {
                loadLevel(--currentLevelIndex);
            } else {
                alert("You are on the first level.");
            }
        };
    };

    // --- Start p5.js ---
    new p5(sketch);
});
