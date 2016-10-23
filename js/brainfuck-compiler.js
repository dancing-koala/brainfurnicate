
Compiler = function(){

	var compiledCode = [], currentInstr = 0, nbSteps = 0, authorizedChars = [",",".","+","-","[","]",">","<","$","#"];
	var memory = [], addr  = 0, output = "", debug = [], startTime = 0, exeTime = 0, finished = false, running = false, stop = false;

	this.init = function(code){
		finished = running = stop = false;
		debug = [];
		memory = [0];
		startTime = addr = exeTime = nbSteps = currentInstr = 0;
		output = "";
		compiledCode = compile(code);
	};

	function compile(code){

		var tabCode = code.split(''), compiledCode = [], loopinIndexes = [];

		for(instr of tabCode){
			compiledCode.push(instr);

			if(instr == "["){
				loopinIndexes.push(compiledCode.length-1);
                compiledCode.push(-1);
			}
			else if(instr == "]"){
				var index = loopinIndexes.pop();
                compiledCode[index+1] = compiledCode.length-1;
                compiledCode.push(index);
			}
		}
		return compiledCode;
	};

	function process(){
		switch(compiledCode[currentInstr]){

			case "+":
				memory[addr] = memory[addr] + 1 & 0xff;
				currentInstr++;
				break;

			case "-":
				if(memory[addr] == undefined)
					memory[addr]=0;
				memory[addr] = memory[addr] - 1 & 0xff;
				currentInstr++;
				break;

			case "[": 
				if(memory[addr] == 0)
					currentInstr = compiledCode[currentInstr + 1]

				currentInstr += 2;
				break;

			case "]":
				if(memory[addr] != 0)
					currentInstr = compiledCode[currentInstr + 1]

				currentInstr += 2;
				break;
			
			case ">":
				if(addr >= memory.length-1)
					memory.push(0);
				addr = addr + 1 & 0xfff;
				currentInstr++;
				break;

			case "<":
				addr = addr - 1 & 0xfff; 
				currentInstr++;
				break;

			case ".":
				output += String.fromCharCode(memory[addr]);
				currentInstr++;
				break;

			case ",":
				var userInput = prompt("Caractère à utiliser:")
				if(userInput != null)
					memory[addr] = userInput.charCodeAt(0);
				currentInstr++;
				break;
				
			default:
				logDebug();
				currentInstr++;
				break;
		}
		return currentInstr < compiledCode.length;
	};

	function logDebug(){
		var infos = {};
		infos.addr = addr;
		infos.val = memory[infos.addr];
		infos.char = String.fromCharCode(infos.val);

		if(debug.length > 511)
			debug.shift();

		debug.push(infos);
	};

	this.run = function(){

		if(startTime == 0)
			startTime = Date.now();

		running = true;

		var keepGoing = (currentInstr < compiledCode.length), i = 10000;

		while(keepGoing && i > 0 && !stop){
			nbSteps++;
			keepGoing = process();
			i--;
		}

		if(keepGoing && !stop){
			var self = this, to = setTimeout(function(){ to = null; self.run()},0);
		}
		else{
			exeTime = Date.now() - startTime;
			finished = true;
			running = false;
		}
	};

	this.interrupt = function(){
		stop = true;
	};

	this.getDetails = function(){
		return {steps : nbSteps, time : exeTime};
	};

	this.getOutput = function(){
		return output;
	};

	this.getDebug = function(){
		return debug;
	};

	this.isFinished = function(){
		return finished;
	};

	this.isRunning = function(){
		return running;
	};

	this.getErrors = function(code){
        var errors = [], i = 0, loop = {};

        loop.opened = loop.closed = 0;

        for(var i = 0;i < code.length;i++){
            if(authorizedChars.indexOf(code.charAt(i)) === -1){
                var error = {};
                error.type = "Instruction incorrecte";
                error.addr = i;
                error.char = code.charAt(i);
                errors.push(error);
            }
            else{
                if(code.charAt(i) == "[")
                    loop.opened++;
                else if(code.charAt(i) == "]")
                    loop.closed++;
            }
        }

        if(loop.opened != loop.closed){
            var error = {};
            error.type = (loop.opened > loop.closed)?(loop.opened-loop.closed)+" ' ] ' manquants":(loop.closed-loop.opened)+" ' [ ' manquants";
            error.addr = NaN;
            error.char = NaN;
            errors.push(error);
        }

        if (errors.length > 0)
            debug = errors;

        return errors;
	}
}