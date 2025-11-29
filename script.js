// --- 1. DEFINE BLOCKS AND GENERATORS (IMMEDIATELY) ---

// Define the look of the blocks
Blockly.Blocks['move_forward'] = {
  init: function() {
    this.appendDummyInput().appendField("Move Forward");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(290); this.setTooltip("Moves the character one step forward.");
  }
};
Blockly.Blocks['turn_left'] = {
  init: function() {
    this.appendDummyInput().appendField("Turn Left");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(290); this.setTooltip("Turns the character 90 degrees left.");
  }
};
Blockly.Blocks['turn_right'] = {
  init: function() {
    this.appendDummyInput().appendField("Turn Right");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(290); this.setTooltip("Turns the character 90 degrees right.");
  }
};
Blockly.Blocks['if_front_is_clear'] = {
  init: function() {
    this.appendStatementInput("DO").setCheck(null).appendField("If path in front is clear, then");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(120); this.setTooltip("Checks if the character can move forward.");
  }
};
Blockly.Blocks['repeat_until'] = {
  init: function() {
    this.appendStatementInput("DO").setCheck(null).appendField("Repeat until goal is reached");
    this.setPreviousStatement(true, null); this.setNextStatement(true, null);
    this.setColour(230); this.setTooltip("Repeats the blocks inside until the goal is reached.");
  }
};

// Define what the blocks do (code generation)
Blockly.JavaScript['move_forward'] = block => 'App.commands.push("move");\n';
Blockly.JavaScript['turn_left'] = block => 'App.commands.push("turn_left");\n';
Blockly.JavaScript['turn_right'] = block => 'App.commands.push("turn_right");\n';

Blockly.JavaScript['controls_repeat_ext'] = function(block, generator) {
  const repetitions = generator.valueToCode(block, 'TIMES', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block.id);
  const loopVar = generator.nameDB_.getReserveName('count', Blockly.Names.NameType.VARIABLE);
  return `for (let ${loopVar} = 0; ${loopVar} < ${repetitions}; ${loopVar}++) {\n${branch}}\n`;
};
Blockly.JavaScript['if_front_is_clear'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  return `if (App.isPathClear()) { ${branch} };\n`;
};
Blockly.JavaScript['repeat_until'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  return `while (!App.isAtGoal()) { ${branch} };\n`;
};


// --- 2. CREATE APPLICATION OBJECT & DEFINE FUNCTIONS ---

const App = {
  // --- Properties ---
  characterX: 0, characterY: 0, characterDirection: 0, goalX: 0, goalY: 0,
  commands: [],
  cellSize: 50,
  canvasSize: 400,
  currentLevelIndex: 0,
  characterImg: null,
  workspace: null,
  p5: null,

  // --- Game Logic Methods ---
  isPathClear: function() {
    let nextX = this.characterX, nextY = this.characterY;
    if (this.characterDirection === 0) nextX += this.cellSize;
    else if (this.characterDirection === 1) nextY += this.cellSize;
    else if (this.characterDirection === 2) nextX -= this.cellSize;
    else if (this.characterDirection === 3) nextY -= this.cellSize;
    const minBound = this.cellSize / 2;
    const maxBound = this.canvasSize - (this.cellSize / 2);
    return (nextX >= minBound && nextX <= maxBound && nextY >= minBound && nextY <= maxBound);
  },
  
  isAtGoal: function() {
      return this.characterX === this.goalX && this.characterY === this.goalY;
  },

  // --- Initialization Method ---
  init: function() {
    // --- p5.js Sketch Definition ---
    const sketch = (p) => {
      App.p5 = p; // Save p5 instance for later
      p.preload = () => {
        this.characterImg = p.loadImage('assets/character.png');
      };

      p.setup = () => {
        const canvas = p.createCanvas(this.canvasSize, this.canvasSize);
        canvas.parent('game-container');
        this.loadLevel(this.currentLevelIndex);
        p.noLoop();
      };

      p.draw = () => {
        p.background(220); 
        this.drawGrid();
        this.drawGoal();
        this.drawCharacter();
      };
    };
    
    // --- Initialize Blockly ---
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: document.getElementById('toolbox'),
      scrollbars: true, trashcan: true,
      zoom: { controls: true, wheel: true, startScale: 1.0 },
      grid: { spacing: 25, length: 3, colour: '#ccc', snap: true }
    });

    // --- Initialize p5.js ---
    new p5(sketch);
  },

  // --- Level and Game State Management ---
  loadLevel: function(levelIndex) {
    const level = levels[levelIndex];
    this.currentLevelIndex = levelIndex;
    this.characterX = level.startPosition[0];
    this.characterY = level.startPosition[1];
    this.characterDirection = level.initialDirection;
    this.goalX = level.goalPosition[0];
    this.goalY = level.goalPosition[1];
    document.getElementById('level-name').innerHTML = level.name;
    document.getElementById('level-instruction').innerHTML = level.instruction;
    this.workspace.clear();
    this.resetCharacter();
  },

  resetCharacter: function() {
    const level = levels[this.currentLevelIndex];
    this.characterX = level.startPosition[0];
    this.characterY = level.startPosition[1];
    this.characterDirection = level.initialDirection;
    this.commands = [];
    if (this.p5 && this.p5.isLooping()) this.p5.noLoop();
    if (this.p5) this.p5.redraw();
  },

  // --- Drawing Methods (called from p5's draw) ---
  drawGrid: function() {
    this.p5.stroke(200);
    for (let x = 0; x <= this.canvasSize; x += this.cellSize) this.p5.line(x, 0, x, this.canvasSize);
    for (let y = 0; y <= this.canvasSize; y += this.cellSize) this.p5.line(0, y, this.canvasSize, y);
  },
  drawGoal: function() {
    this.p5.fill(255, 165, 0);
    this.p5.rect(this.goalX - this.cellSize / 2, this.goalY - this.cellSize / 2, this.cellSize, this.cellSize);
  },
  drawCharacter: function() {
    this.p5.push();
    this.p5.translate(this.characterX, this.characterY);
    this.p5.rotate(this.p5.radians(this.characterDirection * 90));
    this.p5.imageMode(this.p5.CENTER);
    this.p5.image(this.characterImg, 0, 0, this.cellSize * 0.8, this.cellSize * 0.8);
    this.p5.pop();
  },
  
  // --- Execution Logic ---
  run: function() {
    this.resetCharacter();
    const code = Blockly.JavaScript.workspaceToCode(this.workspace);
    
    // This is a safer way to execute the generated code
    try {
      // Create a new async function to handle delays and step-by-step execution
      const execute = async () => {
        // Simple eval is problematic for loops and timing.
        // A better approach is a command queue.
        this.commands = []; // Clear previous commands
        eval(code); // This populates App.commands

        for (const command of this.commands) {
            if (command === "move") {
                if (this.isPathClear()) {
                    if (this.characterDirection === 0) this.characterX += this.cellSize;
                    else if (this.characterDirection === 1) this.characterY += this.cellSize;
                    else if (this.characterDirection === 2) this.characterX -= this.cellSize;
                    else if (this.characterDirection === 3) this.characterY -= this.cellSize;
                }
            } else if (command === "turn_left") {
                this.characterDirection = (this.characterDirection - 1 + 4) % 4;
            } else if (command === "turn_right") {
                this.characterDirection = (this.characterDirection + 1) % 4;
            }
            this.p5.redraw();
            await new Promise(resolve => setTimeout(resolve, 150)); // Wait 150ms between steps

            if (this.isAtGoal()) {
                alert("🎉 Congratulations! Goal Reached!");
                return;
            }
        }
      };
      execute();
      
    } catch (e) {
      console.error("Error executing blocks:", e);
      alert("Error executing blocks! Check the console.");
    }
  }
};

// --- 3. INITIALIZE THE APP (AFTER PAGE HAS LOADED) ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// --- Expose controls to the global scope for HTML buttons ---
function resetAndRunCode() { App.run(); }
function resetCharacter() { App.resetCharacter(); }
function nextLevel() {
  if (App.currentLevelIndex < levels.length - 1) {
    App.loadLevel(App.currentLevelIndex + 1);
  }
}
function previousLevel() {
  if (App.currentLevelIndex > 0) {
    App.loadLevel(App.currentLevelIndex - 1);
  }
}