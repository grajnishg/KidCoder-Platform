// --- Global Game Variables ---
let characterX; 
let characterY; 
let characterDirection = 0; // 0=Right, 1=Down, 2=Left, 3=Up
let cellSize = 50; 
let commands = []; // Queue for commands
let mazeSize = 8; // 8x8 grid (50px * 8 = 400px canvas)
let goalX = (mazeSize - 1) * cellSize + (cellSize / 2); // Goal at bottom-right corner
let goalY = (mazeSize - 1) * cellSize + (cellSize / 2); 
const canvasSize = 400; 
let proceduresMap = {}; // Stores user-defined function bodies

// --- Blockly Initialization ---
const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    grid: { spacing: 25, length: 3, colour: '#ccc', snap: true }
});

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

Blockly.JavaScript['move_forward'] = function(block) {
  return 'commands.push("move");\n'; 
};

Blockly.JavaScript['turn_left'] = function(block) {
  return 'commands.push("turn_left");\n';
};

Blockly.JavaScript['turn_right'] = function(block) {
  return 'commands.push("turn_right");\n';
};

Blockly.JavaScript['controls_repeat_ext'] = function(block) {
  const repetitions = Blockly.JavaScript.valueToCode(block, 'TIMES',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  let branch = Blockly.JavaScript.statementToCode(block, 'DO');
  branch = Blockly.JavaScript.addLoopTrap(branch, block);
  let code = '';
  const loopVar = Blockly.JavaScript.nameDB_.getReserveName(
      'count', Blockly.Names.NameType.VARIABLE);
  code += 'for (var ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + repetitions + '; ' +
      loopVar + '++) {\n' + branch + '}\n';
  return code;
};

Blockly.JavaScript['if_front_is_clear'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  let code = `if_front_is_clear() {\n${branch}}`;
  return `commands.push({type: 'if', code: ${JSON.stringify(code)}});\n`;
};

Blockly.JavaScript['procedures_defreturn'] = 
Blockly.JavaScript['procedures_defnoreturn'] = function(block) {
  const funcName = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Names.NameType.PROCEDURE);
  let branch = Blockly.JavaScript.statementToCode(block, 'STACK');
  if (Blockly.JavaScript.additionally_added) {
    branch = Blockly.JavaScript.additionally_added(branch, block);
  }
  let code = `function ${funcName}() {\n${branch}}`;
  proceduresMap[funcName] = branch; 
  return code;
};

Blockly.JavaScript['procedures_callreturn'] = 
Blockly.JavaScript['procedures_callnoreturn'] = function(block) {
  const funcName = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Names.NameType.PROCEDURE);
  return `commands.push({type: 'call', name: '${funcName}'});\n`;
};

Blockly.JavaScript['repeat_until'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  const loopCommand = {
      type: 'while',
      code: branch 
  };
  return `commands.push(${JSON.stringify(loopCommand)});\n`;
};

// --- P5.js Game Engine Functions ---

function setup() {
  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent('game-container');
  resetCharacter();
  noLoop();
}

function draw() {
  background(220); 
  drawGrid();
  drawGoal();
  drawCharacter();
  
  if (commands.length > 0) {
      const command = commands.shift(); 
      
      if (typeof command === 'string') {
          // Regular Movement Commands
          switch(command) {
              case 'move': moveCharacter(); break;
              case 'turn_left': turnCharacter(-1); break;
              case 'turn_right': turnCharacter(1); break;
          }
      } else if (command.type === 'if') {
          // IF/THEN Conditional Command
          if (isPathClear()) {
              eval(command.code); 
          }
      } else if (command.type === 'call') {
          // Procedure Call
          const funcBody = proceduresMap[command.name];
          if (funcBody) { eval(funcBody); }
      } else if (command.type === 'while') {
          // WHILE/REPEAT UNTIL Conditional Loop Command
          if (characterX === goalX && characterY === goalY) {
              console.log("Loop finished: Goal Reached.");
          } else {
              eval(command.code); 
              commands.unshift(command); // Re-insert the loop command
          }
      }
      
      checkGoal();
      
      if (commands.length === 0) {
          noLoop();
      }
  }
}

function drawGrid() {
  stroke(200);
  for (let x = 0; x <= canvasSize; x += cellSize) line(x, 0, x, canvasSize);
  for (let y = 0; y <= canvasSize; y += cellSize) line(0, y, canvasSize, y);
}

function drawGoal() {
    fill(255, 165, 0); 
    rect(goalX - cellSize/2, goalY - cellSize/2, cellSize, cellSize);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("GOAL", goalX, goalY);
}

function drawCharacter() {
    fill(0, 100, 255);
    ellipse(characterX, characterY, cellSize * 0.8);
    
    // Draw direction indicator (Red Arrow)
    push();
    translate(characterX, characterY);
    rotate(radians(characterDirection * 90));
    fill(255, 0, 0); 
    triangle(10, 0, -10, -5, -10, 5);
    pop();
}

function isPathClear() {
    const moveStep = cellSize;
    let nextX = characterX;
    let nextY = characterY;

    if (characterDirection === 0) nextX += moveStep; 
    else if (characterDirection === 1) nextY += moveStep; 
    else if (characterDirection === 2) nextX -= moveStep; 
    else if (characterDirection === 3) nextX -= moveStep; 

    const minBound = cellSize / 2;
    const maxBound = canvasSize - (cellSize / 2);
    
    return (nextX >= minBound && nextX <= maxBound && 
            nextY >= minBound && nextY <= maxBound);
}

function moveCharacter() {
    if (characterDirection === 0) characterX += cellSize;
    else if (characterDirection === 1) characterY += cellSize;
    else if (characterDirection === 2) characterX -= cellSize;
    else if (characterDirection === 3) characterY -= cellSize;
    
    characterX = constrain(characterX, cellSize / 2, canvasSize - cellSize / 2);
    characterY = constrain(characterY, cellSize / 2, canvasSize - cellSize / 2);
}

function turnCharacter(direction) {
    characterDirection = (characterDirection + direction + 4) % 4;
}

function checkGoal() {
    if (characterX === goalX && characterY === goalY) {
        alert("🎉 Congratulations! Goal Reached!");
        noLoop(); 
    }
}

// --- Execution & Control Functions ---

function resetCharacter() {
    characterX = cellSize / 2;
    characterY = cellSize / 2;
    characterDirection = 0;
    commands = []; 
    noLoop(); 
    redraw(); 
}

function resetAndRunCode() {
    resetCharacter(); 
    
    const code = Blockly.JavaScript.workspaceToCode(workspace);
    
    try {
        eval(code); 
        
        if (commands.length > 0) {
             loop();
        } else {
            alert("No blocks found in the workspace!");
        }
    } catch (e) {
        alert("Error executing blocks! Check the console.");
        console.error(e);
    }
}
EOFcat << 'EOF' > script.js
// --- Global Game Variables ---
let characterX; 
let characterY; 
let characterDirection = 0; // 0=Right, 1=Down, 2=Left, 3=Up
let cellSize = 50; 
let commands = []; // Queue for commands
let mazeSize = 8; // 8x8 grid (50px * 8 = 400px canvas)
let goalX = (mazeSize - 1) * cellSize + (cellSize / 2); // Goal at bottom-right corner
let goalY = (mazeSize - 1) * cellSize + (cellSize / 2); 
const canvasSize = 400; 
let proceduresMap = {}; // Stores user-defined function bodies

// --- Blockly Initialization ---
const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    scrollbars: true,
    trashcan: true,
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    grid: { spacing: 25, length: 3, colour: '#ccc', snap: true }
});

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

Blockly.JavaScript['move_forward'] = function(block) {
  return 'commands.push("move");\n'; 
};

Blockly.JavaScript['turn_left'] = function(block) {
  return 'commands.push("turn_left");\n';
};

Blockly.JavaScript['turn_right'] = function(block) {
  return 'commands.push("turn_right");\n';
};

Blockly.JavaScript['controls_repeat_ext'] = function(block) {
  const repetitions = Blockly.JavaScript.valueToCode(block, 'TIMES',
      Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  let branch = Blockly.JavaScript.statementToCode(block, 'DO');
  branch = Blockly.JavaScript.addLoopTrap(branch, block);
  let code = '';
  const loopVar = Blockly.JavaScript.nameDB_.getReserveName(
      'count', Blockly.Names.NameType.VARIABLE);
  code += 'for (var ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + repetitions + '; ' +
      loopVar + '++) {\n' + branch + '}\n';
  return code;
};

Blockly.JavaScript['if_front_is_clear'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  let code = `if_front_is_clear() {\n${branch}}`;
  return `commands.push({type: 'if', code: ${JSON.stringify(code)}});\n`;
};

Blockly.JavaScript['procedures_defreturn'] = 
Blockly.JavaScript['procedures_defnoreturn'] = function(block) {
  const funcName = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Names.NameType.PROCEDURE);
  let branch = Blockly.JavaScript.statementToCode(block, 'STACK');
  if (Blockly.JavaScript.additionally_added) {
    branch = Blockly.JavaScript.additionally_added(branch, block);
  }
  let code = `function ${funcName}() {\n${branch}}`;
  proceduresMap[funcName] = branch; 
  return code;
};

Blockly.JavaScript['procedures_callreturn'] = 
Blockly.JavaScript['procedures_callnoreturn'] = function(block) {
  const funcName = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Names.NameType.PROCEDURE);
  return `commands.push({type: 'call', name: '${funcName}'});\n`;
};

Blockly.JavaScript['repeat_until'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  const loopCommand = {
      type: 'while',
      code: branch 
  };
  return `commands.push(${JSON.stringify(loopCommand)});\n`;
};

// --- P5.js Game Engine Functions ---

function setup() {
  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent('game-container');
  resetCharacter();
  noLoop();
}

function draw() {
  background(220); 
  drawGrid();
  drawGoal();
  drawCharacter();
  
  if (commands.length > 0) {
      const command = commands.shift(); 
      
      if (typeof command === 'string') {
          // Regular Movement Commands
          switch(command) {
              case 'move': moveCharacter(); break;
              case 'turn_left': turnCharacter(-1); break;
              case 'turn_right': turnCharacter(1); break;
          }
      } else if (command.type === 'if') {
          // IF/THEN Conditional Command
          if (isPathClear()) {
              eval(command.code); 
          }
      } else if (command.type === 'call') {
          // Procedure Call
          const funcBody = proceduresMap[command.name];
          if (funcBody) { eval(funcBody); }
      } else if (command.type === 'while') {
          // WHILE/REPEAT UNTIL Conditional Loop Command
          if (characterX === goalX && characterY === goalY) {
              console.log("Loop finished: Goal Reached.");
          } else {
              eval(command.code); 
              commands.unshift(command); // Re-insert the loop command
          }
      }
      
      checkGoal();
      
      if (commands.length === 0) {
          noLoop();
      }
  }
}

function drawGrid() {
  stroke(200);
  for (let x = 0; x <= canvasSize; x += cellSize) line(x, 0, x, canvasSize);
  for (let y = 0; y <= canvasSize; y += cellSize) line(0, y, canvasSize, y);
}

function drawGoal() {
    fill(255, 165, 0); 
    rect(goalX - cellSize/2, goalY - cellSize/2, cellSize, cellSize);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("GOAL", goalX, goalY);
}

function drawCharacter() {
    fill(0, 100, 255);
    ellipse(characterX, characterY, cellSize * 0.8);
    
    // Draw direction indicator (Red Arrow)
    push();
    translate(characterX, characterY);
    rotate(radians(characterDirection * 90));
    fill(255, 0, 0); 
    triangle(10, 0, -10, -5, -10, 5);
    pop();
}

function isPathClear() {
    const moveStep = cellSize;
    let nextX = characterX;
    let nextY = characterY;

    if (characterDirection === 0) nextX += moveStep; 
    else if (characterDirection === 1) nextY += moveStep; 
    else if (characterDirection === 2) nextX -= moveStep; 
    else if (characterDirection === 3) nextX -= moveStep; 

    const minBound = cellSize / 2;
    const maxBound = canvasSize - (cellSize / 2);
    
    return (nextX >= minBound && nextX <= maxBound && 
            nextY >= minBound && nextY <= maxBound);
}

function moveCharacter() {
    if (characterDirection === 0) characterX += cellSize;
    else if (characterDirection === 1) characterY += cellSize;
    else if (characterDirection === 2) characterX -= cellSize;
    else if (characterDirection === 3) characterY -= cellSize;
    
    characterX = constrain(characterX, cellSize / 2, canvasSize - cellSize / 2);
    characterY = constrain(characterY, cellSize / 2, canvasSize - cellSize / 2);
}

function turnCharacter(direction) {
    characterDirection = (characterDirection + direction + 4) % 4;
}

function checkGoal() {
    if (characterX === goalX && characterY === goalY) {
        alert("🎉 Congratulations! Goal Reached!");
        noLoop(); 
    }
}

// --- Execution & Control Functions ---

function resetCharacter() {
    characterX = cellSize / 2;
    characterY = cellSize / 2;
    characterDirection = 0;
    commands = []; 
    noLoop(); 
    redraw(); 
}

function resetAndRunCode() {
    resetCharacter(); 
    
    const code = Blockly.JavaScript.workspaceToCode(workspace);
    
    try {
        eval(code); 
        
        if (commands.length > 0) {
             loop();
        } else {
            alert("No blocks found in the workspace!");
        }
    } catch (e) {
        alert("Error executing blocks! Check the console.");
        console.error(e);
    }
}
