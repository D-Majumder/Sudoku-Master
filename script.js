document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sudokuBoard = document.getElementById('sudoku-board');
    const newGameBtn = document.getElementById('new-game-btn');
    const checkSolutionBtn = document.getElementById('check-solution-btn');
    const resetBtn = document.getElementById('reset-btn');
    const hintBtn = document.getElementById('hint-btn');
    const difficultySelect = document.getElementById('difficulty');
    const gameTimerDisplay = document.getElementById('game-timer');
    const gameMessages = document.getElementById('game-messages');
    const puzzlesCompletedSpan = document.getElementById('puzzles-completed');
    const fastestTimeSpan = document.getElementById('fastest-time');
    const totalTimeSpan = document.getElementById('total-time');
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    const resetModal = document.getElementById('reset-modal');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const themeToggleCheckbox = document.getElementById('theme-toggle');
    const fontStyleSelect = document.getElementById('font-style');
    const fontSizeRange = document.getElementById('font-size');
    const fontSizeValueSpan = document.getElementById('font-size-value');
    const leaderboardList = document.getElementById('leaderboard-list');

    // --- Game State Variables ---
    let currentPuzzle = []; // The puzzle with blanks (user can fill)
    let solvedPuzzle = []; // The complete, solved puzzle
    let userBoard = []; // User's current entries (cloned from currentPuzzle)
    let timerInterval;
    let seconds = 0;
    let selectedCell = null; // To track currently selected input for keyboard navigation
    let prefilledCells = new Set(); // Stores indices of original puzzle cells
    let gameSolved = false;

    // --- Sudoku Generation & Solver Core Logic ---
    // (Based on backtracking algorithm)

    /**
     * Fills the entire 9x9 grid with a valid Sudoku solution using backtracking.
     * @param {number[][]} grid - The 9x9 Sudoku grid.
     * @returns {boolean} True if a solution is found, false otherwise.
     */
    function solveSudoku(grid) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (grid[row][col] === 0) { // If cell is empty
                    for (let num = 1; num <= 9; num++) {
                        if (isValidMove(grid, row, col, num)) {
                            grid[row][col] = num;

                            if (solveSudoku(grid)) { // Recurse
                                return true;
                            } else {
                                grid[row][col] = 0; // Backtrack
                            }
                        }
                    }
                    return false; // No valid number found for this cell
                }
            }
        }
        return true; // All cells filled
    }

    /**
     * Checks if placing a number at a given position is valid according to Sudoku rules.
     * @param {number[][]} grid - The Sudoku grid.
     * @param {number} row - The row index.
     * @param {number} col - The column index.
     * @param {number} num - The number to check.
     * @returns {boolean} True if the move is valid, false otherwise.
     */
    function isValidMove(grid, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) {
                return false;
            }
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) {
                return false;
            }
        }

        // Check 3x3 box
        let startRow = Math.floor(row / 3) * 3;
        let startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i + startRow][j + startCol] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Generates a fully solved Sudoku board.
     * @returns {number[][]} A 9x9 solved Sudoku grid.
     */
    function generateSolvedSudoku() {
        let grid = Array(9).fill(null).map(() => Array(9).fill(0));
        solveSudoku(grid); // This will fill the grid
        return grid;
    }

    /**
     * Removes numbers from a solved Sudoku grid to create a puzzle.
     * Ensures the puzzle has a unique solution.
     * @param {number[][]} solvedGrid - The fully solved Sudoku grid.
     * @param {string} difficulty - 'easy', 'medium', or 'hard'.
     * @returns {number[][]} The Sudoku puzzle with blanks.
     */
    function generatePuzzle(solvedGrid, difficulty = 'medium') {
        let puzzle = JSON.parse(JSON.stringify(solvedGrid)); // Deep copy
        let cellsToRemove = 0;

        switch (difficulty) {
            case 'easy':
                cellsToRemove = 35; // Around 46 clues
                break;
            case 'medium':
                cellsToRemove = 45; // Around 36 clues
                break;
            case 'hard':
                cellsToRemove = 55; // Around 26 clues
                break;
            default:
                cellsToRemove = 45;
        }

        let attempts = 0;
        while (cellsToRemove > 0 && attempts < 1000) { // Limit attempts to prevent infinite loops
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);

            if (puzzle[row][col] !== 0) { // If cell is not already empty
                let originalValue = puzzle[row][col];
                puzzle[row][col] = 0; // Temporarily remove number

                // Check for unique solution (naive check, can be slow for many removals)
                let tempGrid = JSON.parse(JSON.stringify(puzzle));
                let solutionCount = countSolutions(tempGrid);

                if (solutionCount === 1) {
                    cellsToRemove--;
                } else {
                    puzzle[row][col] = originalValue; // If not unique, restore
                }
            }
            attempts++;
        }
        return puzzle;
    }

    /**
     * Counts the number of solutions for a given Sudoku grid.
     * Used to ensure puzzle has a unique solution.
     * @param {number[][]} grid - The Sudoku grid.
     * @returns {number} The number of solutions found.
     */
    function countSolutions(grid) {
        let solutions = 0;
        let tempGrid = JSON.parse(JSON.stringify(grid)); // Deep copy

        function findSolutions(currentGrid) {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (currentGrid[row][col] === 0) {
                        for (let num = 1; num <= 9; num++) {
                            if (isValidMove(currentGrid, row, col, num)) {
                                currentGrid[row][col] = num;
                                findSolutions(currentGrid); // Recurse
                                currentGrid[row][col] = 0; // Backtrack
                            }
                        }
                        return; // No number fits, this path leads to no solution
                    }
                }
            }
            solutions++; // Found a solution
        }
        findSolutions(tempGrid);
        return solutions;
    }


    // --- Game Board Rendering ---

    /**
     * Renders the Sudoku board in the DOM.
     * @param {number[][]} board - The 9x9 Sudoku board (puzzle or user's current).
     */
    function renderBoard(board) {
        sudokuBoard.innerHTML = ''; // Clear previous board
        prefilledCells.clear(); // Clear prefilled indices

        board.forEach((row, rowIndex) => {
            row.forEach((num, colIndex) => {
                const cell = document.createElement('div');
                cell.classList.add('sudoku-cell');

                // Add thicker borders for 3x3 blocks
                if (colIndex % 3 === 2 && colIndex !== 8) {
                    cell.classList.add('border-right-bold');
                }
                if (rowIndex % 3 === 2 && rowIndex !== 8) {
                    cell.classList.add('border-bottom-bold');
                }

                const input = document.createElement('input');
                input.type = 'number';
                input.min = '1';
                input.max = '9';
                input.maxLength = '1'; // Limit input to one digit
                input.dataset.row = rowIndex;
                input.dataset.col = colIndex;

                if (num !== 0) {
                    input.value = num;
                    input.readOnly = true; // Prefilled numbers are non-editable
                    cell.classList.add('prefilled');
                    prefilledCells.add(rowIndex * 9 + colIndex); // Store index
                } else {
                    input.value = ''; // Ensure blank for empty cells
                    input.addEventListener('input', handleCellInput);
                    input.addEventListener('focus', handleCellFocus);
                    input.addEventListener('blur', handleCellBlur);
                }

                cell.appendChild(input);
                sudokuBoard.appendChild(cell);
            });
        });
    }

    // --- User Input & Interaction ---

    function handleCellInput(event) {
        let input = event.target;
        let value = input.value.trim();

        // Ensure single digit input
        if (value.length > 1) {
            value = value.charAt(0);
            input.value = value;
        }

        // Only allow numbers 1-9
        if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 9)) {
            let row = parseInt(input.dataset.row);
            let col = parseInt(input.dataset.col);
            userBoard[row][col] = value === '' ? 0 : parseInt(value);
            clearMessages();
            highlightInvalidEntries(); // Highlight errors as user types
            checkWinCondition(); // Check if puzzle is solved
        } else {
            input.value = ''; // Clear invalid input
        }
    }

    function handleCellFocus(event) {
        selectedCell = event.target;
        highlightRelatedCells(selectedCell);
    }

    function handleCellBlur(event) {
        selectedCell = null;
        clearHighlights();
    }

    function highlightRelatedCells(inputElement) {
        clearHighlights();
        const row = parseInt(inputElement.dataset.row);
        const col = parseInt(inputElement.dataset.col);
        const cells = sudokuBoard.children;

        // Highlight row, column, and 3x3 box
        for (let i = 0; i < 9; i++) {
            cells[row * 9 + i].classList.add('highlight'); // Row
            cells[i * 9 + col].classList.add('highlight'); // Column
        }

        let startRow = Math.floor(row / 3) * 3;
        let startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                cells[(startRow + i) * 9 + (startCol + j)].classList.add('highlight');
            }
        }
        inputElement.closest('.sudoku-cell').classList.add('selected'); // Highlight the selected cell itself
    }

    function clearHighlights() {
        document.querySelectorAll('.sudoku-cell').forEach(cell => {
            cell.classList.remove('highlight', 'selected', 'error', 'success-flash');
        });
    }

    /**
     * Highlights invalid entries in the Sudoku board.
     * An entry is invalid if it violates Sudoku rules (row, column, 3x3 box).
     * @returns {boolean} True if any invalid entries are found, false otherwise.
     */
    function highlightInvalidEntries() {
        let hasErrors = false;
        const cells = sudokuBoard.children;

        // Clear existing error highlights first
        document.querySelectorAll('.sudoku-cell.error').forEach(cell => cell.classList.remove('error'));

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                let cellValue = userBoard[row][col];
                if (cellValue === 0) continue; // Skip empty cells

                // Temporarily set to 0 to check if current value is invalid
                userBoard[row][col] = 0;
                const isValid = isValidMove(userBoard, row, col, cellValue);
                userBoard[row][col] = cellValue; // Restore value

                if (!isValid) {
                    cells[row * 9 + col].classList.add('error');
                    hasErrors = true;
                }
            }
        }
        return hasErrors;
    }

    /**
     * Checks if the user's current board matches the solved puzzle.
     * @returns {boolean} True if solved, false otherwise.
     */
    function isBoardSolved() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (userBoard[r][c] !== solvedPuzzle[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Displays a message to the user.
     * @param {string} message - The message text.
     * @param {string} type - 'success' or 'error'.
     */
    function showMessage(message, type) {
        gameMessages.textContent = message;
        gameMessages.className = `messages ${type}`;
    }

    function clearMessages() {
        gameMessages.textContent = '';
        gameMessages.className = 'messages';
    }

    // --- Game Control & State ---

    /**
     * Starts a new game.
     */
    function startNewGame() {
        gameSolved = false;
        clearMessages();
        clearHighlights();
        stopTimer();
        seconds = 0;
        gameTimerDisplay.textContent = '00:00';

        const difficulty = difficultySelect.value;
        solvedPuzzle = generateSolvedSudoku();
        currentPuzzle = generatePuzzle(solvedPuzzle, difficulty);
        userBoard = JSON.parse(JSON.stringify(currentPuzzle)); // Clone currentPuzzle for user edits
        renderBoard(currentPuzzle);
        startTimer();
    }

    /**
     * Checks the current solution entered by the user.
     */
    function checkSolution() {
        clearMessages();
        clearHighlights(); // Clear any previous error highlights

        const hasErrors = highlightInvalidEntries();

        if (hasErrors) {
            showMessage('Some entries are incorrect. Please check the highlighted cells.', 'error');
        } else if (isBoardSolved()) {
            showMessage('Congratulations! You solved the Sudoku!', 'success');
            stopTimer();
            gameSolved = true;
            updateStats();
            animateSolvedBoard();
        } else {
            showMessage('All entries are valid, but the puzzle is not yet solved. Keep going!', 'info');
        }
    }

    /**
     * Resets only the user-entered numbers, keeping prefilled numbers.
     */
    function resetGame() {
        clearMessages();
        clearHighlights();
        // Restore userBoard from currentPuzzle (which holds original state)
        userBoard = JSON.parse(JSON.stringify(currentPuzzle));
        renderBoard(currentPuzzle); // Re-render to clear inputs
        document.querySelectorAll('.sudoku-cell input:not([readonly])').forEach(input => input.value = ''); // Ensure empty cells are clear
        gameSolved = false;
        stopTimer(); // Reset timer for current game (optional, could restart)
        seconds = 0;
        gameTimerDisplay.textContent = '00:00';
        startTimer(); // Restart timer
    }

    /**
     * Fills one random empty cell with the correct number.
     */
    function provideHint() {
        if (gameSolved) {
            showMessage('Puzzle already solved!', 'success');
            return;
        }

        const emptyCells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (userBoard[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const row = randomCell.r;
            const col = randomCell.c;
            const correctValue = solvedPuzzle[row][col];

            userBoard[row][col] = correctValue;
            const cellElement = sudokuBoard.children[row * 9 + col];
            const inputElement = cellElement.querySelector('input');
            inputElement.value = correctValue;
            inputElement.classList.add('hinted'); // Add a class for hinted cells if desired

            clearMessages();
            highlightInvalidEntries(); // Re-check validation after hint
            checkWinCondition();
        } else {
            showMessage('No more empty cells to hint!', 'info');
        }
    }

    /**
     * Checks if the puzzle is solved after each input or hint.
     */
    function checkWinCondition() {
        if (!gameSolved && isBoardSolved() && !highlightInvalidEntries()) {
            showMessage('Congratulations! You solved the Sudoku!', 'success');
            stopTimer();
            gameSolved = true;
            updateStats();
            animateSolvedBoard();
        }
    }

    function animateSolvedBoard() {
        const cells = sudokuBoard.children;
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.classList.add('success-flash');
            }, index * 10); // Stagger the animation
        });
        // Remove the class after animation
        setTimeout(() => {
            cells.forEach(cell => cell.classList.remove('success-flash'));
        }, cells.length * 10 + 1000); // Wait for all animations + 1 second
    }

    // --- Timer Functions ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval); // Clear any existing timer
        timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            gameTimerDisplay.textContent =
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function formatTime(totalSeconds) {
        if (totalSeconds === null || isNaN(totalSeconds)) return 'N/A';
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }


    // --- Stats & Leaderboard ---
    let stats = {
        puzzlesCompleted: 0,
        fastestTime: Infinity, // Store in seconds
        totalTime: 0, // Store in seconds
        leaderboard: [] // [{time: seconds, date: timestamp}]
    };

    function loadStats() {
        const savedStats = localStorage.getItem('sudokuStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
            // Handle Infinity correctly as JSON.parse converts it to null
            if (stats.fastestTime === null) stats.fastestTime = Infinity;
        }
        updateStatsDisplay();
        renderLeaderboard();
    }

    function saveStats() {
        localStorage.setItem('sudokuStats', JSON.stringify(stats));
    }

    function updateStats() {
        stats.puzzlesCompleted++;
        stats.totalTime += seconds;

        if (seconds < stats.fastestTime) {
            stats.fastestTime = seconds;
        }

        // Add to leaderboard
        stats.leaderboard.push({
            time: seconds,
            date: new Date().toISOString()
        });
        // Sort leaderboard by time, fastest first, keep top 10
        stats.leaderboard.sort((a, b) => a.time - b.time);
        if (stats.leaderboard.length > 10) {
            stats.leaderboard = stats.leaderboard.slice(0, 10);
        }

        saveStats();
        updateStatsDisplay();
        renderLeaderboard();
    }

    function updateStatsDisplay() {
        puzzlesCompletedSpan.textContent = stats.puzzlesCompleted;
        fastestTimeSpan.textContent = formatTime(stats.fastestTime === Infinity ? null : stats.fastestTime);
        totalTimeSpan.textContent = formatTime(stats.totalTime);
    }

    function resetAllStats() {
        const confirmed = confirm('Are you sure you want to reset all game statistics and leaderboard? This cannot be undone.');
        if (confirmed) {
            stats = {
                puzzlesCompleted: 0,
                fastestTime: Infinity,
                totalTime: 0,
                leaderboard: []
            };
            saveStats();
            updateStatsDisplay();
            renderLeaderboard();
            showMessage('All statistics have been reset!', 'info');
        }
    }

    function renderLeaderboard() {
        leaderboardList.innerHTML = '';
        if (stats.leaderboard.length === 0) {
            const li = document.createElement('li');
            li.classList.add('leaderboard-empty-message');
            li.textContent = 'No times recorded yet. Solve a puzzle!';
            leaderboardList.appendChild(li);
            return;
        }

        stats.leaderboard.forEach((entry, index) => {
            const li = document.createElement('li');
            const rank = index + 1;
            const time = formatTime(entry.time);
            const date = new Date(entry.date).toLocaleDateString();
            li.textContent = `#${rank}: ${time} (${date})`;
            leaderboardList.appendChild(li);
        });
    }

    // --- Customizations ---
    function applyBoardFont() {
        const selectedFont = fontStyleSelect.value;
        sudokuBoard.style.fontFamily = `'${selectedFont}', monospace`; // Always include monospace fallback
    }

    function applyBoardFontSize() {
        const selectedSize = fontSizeRange.value;
        document.documentElement.style.setProperty('--board-font-size', `${selectedSize}px`); // Use a CSS variable
        // Update the input font size directly as well for visual feedback
        document.querySelectorAll('.sudoku-cell input').forEach(input => {
            input.style.fontSize = `${selectedSize}px`;
        });
        fontSizeValueSpan.textContent = `${selectedSize}px`;
    }

    // Apply default font size on load
    applyBoardFontSize(); // Call once on load to set initial value

    // --- Keyboard Navigation ---
    document.addEventListener('keydown', (event) => {
        if (!selectedCell) return;

        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        let nextRow = row;
        let nextCol = col;

        switch (event.key) {
            case 'ArrowUp':
                nextRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                nextRow = Math.min(8, row + 1);
                break;
            case 'ArrowLeft':
                nextCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                nextCol = Math.min(8, col + 1);
                break;
            case 'Backspace':
            case 'Delete':
                // Clear the cell if it's not prefilled
                if (!selectedCell.readOnly) {
                    selectedCell.value = '';
                    userBoard[row][col] = 0;
                    clearMessages();
                    highlightInvalidEntries();
                }
                return; // Prevent default action for backspace/delete
            case '1': case '2': case '3': case '4': case '5':
            case '6': case '7': case '8': case '9':
                // Auto-fill and move to next editable cell
                if (!selectedCell.readOnly) {
                    selectedCell.value = event.key;
                    selectedCell.dispatchEvent(new Event('input')); // Trigger input event
                    // Find next editable cell
                    let nextEditableCell = null;
                    const inputs = Array.from(sudokuBoard.querySelectorAll('input:not([readonly])'));
                    const currentIndex = inputs.indexOf(selectedCell);
                    for (let i = currentIndex + 1; i < inputs.length; i++) {
                        if (!inputs[i].readOnly) {
                            nextEditableCell = inputs[i];
                            break;
                        }
                    }
                    if (nextEditableCell) {
                        nextEditableCell.focus();
                    } else {
                        selectedCell.blur(); // If no next editable, unfocus
                    }
                }
                return; // Prevent default action for number keys
            default:
                return; // Do nothing for other keys
        }

        // Move focus to the new cell if changed
        if (nextRow !== row || nextCol !== col) {
            const nextCellElement = sudokuBoard.children[nextRow * 9 + nextCol];
            if (nextCellElement) {
                nextCellElement.querySelector('input').focus();
            }
        }
        event.preventDefault(); // Prevent default arrow key scrolling
    });


    // --- Event Listeners ---
    newGameBtn.addEventListener('click', startNewGame);
    checkSolutionBtn.addEventListener('click', checkSolution);
    hintBtn.addEventListener('click', provideHint);
    difficultySelect.addEventListener('change', startNewGame);
    resetStatsBtn.addEventListener('click', resetAllStats);

    // Reset button with modal confirmation
    resetBtn.addEventListener('click', () => {
        resetModal.classList.add('active');
    });
    confirmResetBtn.addEventListener('click', () => {
        resetGame(); // Perform the actual reset
        resetModal.classList.remove('active');
    });
    cancelResetBtn.addEventListener('click', () => {
        resetModal.classList.remove('active');
    });
    // Close modal if clicking outside content or on 'X'
    resetModal.addEventListener('click', (event) => {
        if (event.target === resetModal || event.target.closest('.modal-close')) {
            resetModal.classList.remove('active');
        }
    });

    // Theme toggle (JS to save preference, CSS handles visual)
    themeToggleCheckbox.addEventListener('change', () => {
        if (themeToggleCheckbox.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Customizations
    fontStyleSelect.addEventListener('change', applyBoardFont);
    fontSizeRange.addEventListener('input', applyBoardFontSize);

    // --- Initial Load ---
    function initializeGame() {
        // Apply saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            themeToggleCheckbox.checked = true;
            document.body.classList.add('dark-mode');
        } else {
            themeToggleCheckbox.checked = false;
            document.body.classList.remove('dark-mode');
        }

        // Apply saved font style (if any)
        const savedFontStyle = localStorage.getItem('sudokuBoardFont');
        if (savedFontStyle) {
            fontStyleSelect.value = savedFontStyle;
            applyBoardFont();
        } else {
            applyBoardFont(); // Apply default
        }
        fontStyleSelect.addEventListener('change', () => {
            applyBoardFont();
            localStorage.setItem('sudokuBoardFont', fontStyleSelect.value);
        });

        // Apply saved font size
        const savedFontSize = localStorage.getItem('sudokuBoardFontSize');
        if (savedFontSize) {
            fontSizeRange.value = savedFontSize;
            applyBoardFontSize();
        } else {
            applyBoardFontSize(); // Apply default
        }
        fontSizeRange.addEventListener('input', () => {
            applyBoardFontSize();
            localStorage.setItem('sudokuBoardFontSize', fontSizeRange.value);
        });

        loadStats(); // Load user stats
        startNewGame(); // Start the first game
    }

    initializeGame();
});