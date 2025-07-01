 let gameState = {
            grid: Array(81).fill(0),
            solution: Array(81).fill(0),
            given: Array(81).fill(false),
            invalid: Array(81).fill(false),
            selectedCell: -1,
            timer: 0,
            timerInterval: null,
            hints: 3,
            isPaused: false,
            playerName: ''
        };

        const difficulties = {
            easy: 40,
            medium: 50,
            hard: 60,
            expert: 70
        };

        function startGame() {
            const username = document.getElementById('username').value.trim();
            const difficulty = document.getElementById('startDifficulty').value;
            
            if (!username) {
                alert('Please enter your name to start the game!');
                return;
            }
            
            gameState.playerName = username;
            document.getElementById('playerName').textContent = username;
            document.getElementById('difficulty').value = difficulty;
            
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'block';
            
            newGame();
        }

        function initGame() {
            createGrid();
        }

        function createGrid() {
            const grid = document.getElementById('grid');
            grid.innerHTML = '';
            
            for (let i = 0; i < 81; i++) {
                const cell = document.createElement('input');
                cell.className = 'cell';
                cell.type = 'text';
                cell.maxLength = 1;
                cell.dataset.index = i;
                
                cell.addEventListener('click', () => selectCell(i));
                cell.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 1 && value <= 9) {
                        handleNumberInput(i, value);
                    } else {
                        e.target.value = '';
                        gameState.grid[i] = 0;
                    }
                });
                
                cell.addEventListener('keydown', (e) => {
                    if (e.key >= '1' && e.key <= '9') {
                        e.preventDefault();
                        handleNumberInput(i, parseInt(e.key));
                    } else if (e.key === 'Backspace' || e.key === 'Delete') {
                        e.preventDefault();
                        handleNumberInput(i, 0);
                    }
                });
                
                grid.appendChild(cell);
            }
        }

        function generateSolution() {
            const grid = Array(81).fill(0);
            
            function isValid(grid, row, col, num) {
                for (let x = 0; x < 9; x++) {
                    if (grid[row * 9 + x] === num || grid[x * 9 + col] === num) {
                        return false;
                    }
                }
                
                const startRow = row - row % 3;
                const startCol = col - col % 3;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (grid[(startRow + i) * 9 + (startCol + j)] === num) {
                            return false;
                        }
                    }
                }
                return true;
            }
            
            function solve(grid) {
                for (let i = 0; i < 81; i++) {
                    const row = Math.floor(i / 9);
                    const col = i % 9;
                    
                    if (grid[i] === 0) {
                        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                        shuffle(numbers);
                        
                        for (const num of numbers) {
                            if (isValid(grid, row, col, num)) {
                                grid[i] = num;
                                if (solve(grid)) {
                                    return true;
                                }
                                grid[i] = 0;
                            }
                        }
                        return false;
                    }
                }
                return true;
            }
            
            solve(grid);
            return grid;
        }

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function generatePuzzle(difficulty) {
            const solution = generateSolution();
            const puzzle = [...solution];
            const toRemove = difficulties[difficulty];
            
            const positions = Array.from({length: 81}, (_, i) => i);
            shuffle(positions);
            
            for (let i = 0; i < toRemove; i++) {
                puzzle[positions[i]] = 0;
            }
            
            return { puzzle, solution };
        }

        function isValidMove(grid, index, num) {
            if (num === 0) return true; // Empty cell is always valid
            
            const row = Math.floor(index / 9);
            const col = index % 9;
            
            // Check row
            for (let c = 0; c < 9; c++) {
                if (c !== col && grid[row * 9 + c] === num) {
                    return false;
                }
            }
            
            // Check column
            for (let r = 0; r < 9; r++) {
                if (r !== row && grid[r * 9 + col] === num) {
                    return false;
                }
            }
            
            // Check 3x3 box
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let r = boxRow; r < boxRow + 3; r++) {
                for (let c = boxCol; c < boxCol + 3; c++) {
                    if ((r !== row || c !== col) && grid[r * 9 + c] === num) {
                        return false;
                    }
                }
            }
            
            return true;
        }

        function newGame() {
            const difficulty = document.getElementById('difficulty').value;
            const { puzzle, solution } = generatePuzzle(difficulty);
            
            gameState.grid = [...puzzle];
            gameState.solution = [...solution];
            gameState.given = puzzle.map(cell => cell !== 0);
            gameState.invalid = Array(81).fill(false);
            gameState.selectedCell = -1;
            gameState.timer = 0;
            gameState.hints = 3;
            gameState.isPaused = false;
            
            updateDisplay();
            startTimer();
        }

        function updateDisplay() {
            const cells = document.querySelectorAll('.cell');
            
            // Clear all highlights first
            cells.forEach(cell => {
                cell.classList.remove('highlight');
            });
            
            cells.forEach((cell, i) => {
                cell.value = gameState.grid[i] || '';
                cell.className = 'cell';
                
                if (gameState.given[i]) {
                    cell.classList.add('given');
                    cell.readOnly = true;
                } else {
                    cell.readOnly = false;
                }
                
                if (gameState.invalid[i]) {
                    cell.classList.add('invalid');
                }
                
                if (i === gameState.selectedCell) {
                    cell.classList.add('selected');
                }
            });
            
            document.getElementById('hints').textContent = gameState.hints;
            updateTimer();
            
            // Highlight related cells if there's a selection
            if (gameState.selectedCell !== -1) {
                highlightRelated(gameState.selectedCell);
            }
        }

        function selectCell(index) {
            if (gameState.isPaused) return;
            
            gameState.selectedCell = index;
            updateDisplay();
            
            // Focus the cell for keyboard input
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (cell && !cell.readOnly) {
                cell.focus();
            }
        }

        function highlightRelated(index) {
            const cells = document.querySelectorAll('.cell');
            const row = Math.floor(index / 9);
            const col = index % 9;
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            
            cells.forEach((cell, i) => {
                const cellRow = Math.floor(i / 9);
                const cellCol = i % 9;
                
                if (i === index) return;
                
                if (cellRow === row || cellCol === col || 
                    (cellRow >= boxRow && cellRow < boxRow + 3 && 
                     cellCol >= boxCol && cellCol < boxCol + 3)) {
                    cell.classList.add('highlight');
                }
            });
        }

        function selectNumber(num) {
            if (gameState.selectedCell === -1 || gameState.isPaused) return;
            handleNumberInput(gameState.selectedCell, num);
        }

        function handleNumberInput(index, num) {
            if (gameState.given[index] || gameState.isPaused) return;
            
            // Clear invalid state when changing number
            gameState.invalid[index] = false;
            gameState.grid[index] = num;
            
            // Check if the move is valid
            if (num !== 0 && !isValidMove(gameState.grid, index, num)) {
                gameState.invalid[index] = true;
            }
            
            updateDisplay();
            
            if (checkWin()) {
                setTimeout(() => showWinModal(), 500);
            }
        }

        function getHint() {
            if (gameState.hints <= 0 || gameState.selectedCell === -1 || gameState.isPaused) return;
            
            const index = gameState.selectedCell;
            if (gameState.given[index] || gameState.grid[index] !== 0) return;
            
            gameState.grid[index] = gameState.solution[index];
            gameState.hints--;
            
            const cell = document.querySelector(`[data-index="${index}"]`);
            cell.value = gameState.solution[index];
            cell.classList.add('correct');
            
            updateDisplay();
            
            if (checkWin()) {
                setTimeout(() => showWinModal(), 500);
            }
        }

        function checkSolution() {
            if (gameState.isPaused) return;
            
            let hasErrors = false;
            const cells = document.querySelectorAll('.cell');
            
            gameState.grid.forEach((value, i) => {
                if (value !== 0 && value !== gameState.solution[i]) {
                    cells[i].classList.add('error');
                    hasErrors = true;
                    setTimeout(() => cells[i].classList.remove('error'), 1000);
                }
            });
            
            if (!hasErrors && gameState.grid.every(cell => cell !== 0)) {
                showWinModal();
            }
        }

        function checkWin() {
            return gameState.grid.every((cell, i) => cell === gameState.solution[i]);
        }

        function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    const btn = document.querySelector('button[onclick="pauseGame()"]');
    
    if (gameState.isPaused) {
        clearInterval(gameState.timerInterval);
        btn.textContent = 'Resume';
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.color = 'transparent';
            cell.style.background = '#ddd';
        });
    } else {
        startTimer();
        btn.textContent = 'Pause';
        // Clear the inline styles that were blocking the CSS classes
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.color = '';
            cell.style.background = '';
        });
        updateDisplay();
    }
}

        function startTimer() {
            clearInterval(gameState.timerInterval);
            gameState.timerInterval = setInterval(() => {
                gameState.timer++;
                updateTimer();
            }, 1000);
        }

        function updateTimer() {
            const minutes = Math.floor(gameState.timer / 60);
            const seconds = gameState.timer % 60;
            document.getElementById('timer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        function showWinModal() {
            clearInterval(gameState.timerInterval);
            document.getElementById('finalTime').textContent = document.getElementById('timer').textContent;
            document.getElementById('winModal').style.display = 'block';
            createConfetti();
        }

        function closeModal() {
            document.getElementById('winModal').style.display = 'none';
        }

        function createConfetti() {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
            
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 3 + 's';
                    document.body.appendChild(confetti);
                    
                    setTimeout(() => confetti.remove(), 3000);
                }, i * 100);
            }
        }

        // Initialize the game when page loads
        window.addEventListener('load', initGame);
        
        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (gameState.isPaused) return;
            
            const currentCell = gameState.selectedCell;
            if (currentCell === -1) return;
            
            let newCell = currentCell;
            let shouldNavigate = false;
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newCell = currentCell - 9;
                    if (newCell >= 0) {
                        shouldNavigate = true;
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newCell = currentCell + 9;
                    if (newCell < 81) {
                        shouldNavigate = true;
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newCell = currentCell - 1;
                    if (newCell >= 0 && Math.floor(newCell / 9) === Math.floor(currentCell / 9)) {
                        shouldNavigate = true;
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newCell = currentCell + 1;
                    if (newCell < 81 && Math.floor(newCell / 9) === Math.floor(currentCell / 9)) {
                        shouldNavigate = true;
                    }
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    handleNumberInput(currentCell, parseInt(e.key));
                    break;
                case 'Backspace':
                case 'Delete':
                case '0':
                    e.preventDefault();
                    handleNumberInput(currentCell, 0);
                    break;
            }
            
            // Navigate to new cell and focus it
            if (shouldNavigate) {
                selectCell(newCell);
            }
        });