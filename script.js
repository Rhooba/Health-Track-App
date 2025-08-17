class TruthTableCheckers {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'player';
        this.selectedPiece = null;
        this.gameState = 'playing';
        this.playerScore = 0;
        this.aiScore = 0;
        this.currentChallenge = null;
        this.timer = null;
        this.timeLeft = 30;
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Place player pieces (bottom 3 rows)
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = {
                        type: 'player',
                        operator: this.getRandomOperator(),
                        isKing: false
                    };
                }
            }
        }
        
        // Place AI pieces (top 3 rows)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = {
                        type: 'ai',
                        operator: this.getRandomOperator(),
                        isKing: false
                    };
                }
            }
        }
        
        return board;
    }

    getRandomOperator() {
        const operators = ['AND', 'OR', 'NOT', 'IMPLIES', 'BICONDITIONAL', 'COMPLEX', 'TAUTOLOGY'];
        return operators[Math.floor(Math.random() * operators.length)];
    }

    initializeGame() {
        this.renderBoard();
        this.updateScore();
    }

    renderBoard() {
        const boardElement = document.getElementById('checkers-board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.type} ${piece.isKing ? 'king' : ''}`;
                    pieceElement.textContent = this.getOperatorSymbol(piece.operator);
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', (e) => this.handleSquareClick(row, col, e));
                boardElement.appendChild(square);
            }
        }
    }

    getOperatorSymbol(operator) {
        const symbols = {
            'AND': '∧',
            'OR': '∨',
            'NOT': '¬',
            'IMPLIES': '→',
            'BICONDITIONAL': '↔',
            'COMPLEX': '⚡',
            'TAUTOLOGY': 'L'
        };
        return symbols[operator] || '?';
    }

    handleSquareClick(row, col, event) {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'player') return;

        const piece = this.board[row][col];
        
        if (this.selectedPiece) {
            // Try to move selected piece
            if (this.isValidMove(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
                this.showChallenge(this.selectedPiece.row, this.selectedPiece.col, row, col);
            } else {
                this.clearSelection();
            }
        } else if (piece && piece.type === 'player') {
            // Select piece
            this.selectedPiece = { row, col, piece };
            this.highlightValidMoves(row, col);
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Basic checkers movement rules
        const piece = this.board[fromRow][fromCol];
        const target = this.board[toRow][toCol];
        
        if (target !== null) return false; // Can't move to occupied square
        
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // Regular pieces can only move forward (up for player)
        if (!piece.isKing && piece.type === 'player' && rowDiff >= 0) return false;
        if (!piece.isKing && piece.type === 'ai' && rowDiff <= 0) return false;
        
        // Must move diagonally
        if (Math.abs(rowDiff) !== colDiff) return false;
        
        // Single step or capture
        if (Math.abs(rowDiff) === 1) return true;
        if (Math.abs(rowDiff) === 2) {
            // Check for capture
            const midRow = fromRow + rowDiff / 2;
            const midCol = fromCol + (toCol - fromCol) / 2;
            const capturedPiece = this.board[midRow][midCol];
            return capturedPiece && capturedPiece.type !== piece.type;
        }
        
        return false;
    }

    highlightValidMoves(row, col) {
        this.clearHighlights();
        
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('highlighted');
        
        // Highlight valid moves
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    const targetSquare = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    targetSquare.classList.add('valid-move');
                }
            }
        }
    }

    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('highlighted', 'valid-move');
        });
    }

    clearSelection() {
        this.selectedPiece = null;
        this.clearHighlights();
    }

    showChallenge(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        this.currentComplexExpression = null; // Reset for new challenge
        this.currentTautology = null; // Reset for new challenge
        this.currentChallenge = {
            fromRow, fromCol, toRow, toCol,
            operator: piece.operator,
            answer: null
        };

        const challenge = this.generateTruthTableChallenge(piece.operator);
        this.displayChallenge(challenge);
        this.startTimer();
    }

    generateTruthTableChallenge(operator) {
        const variables = ['P', 'Q'];
        const rows = [
            [true, true],
            [true, false],
            [false, true],
            [false, false]
        ];

        // For IMPLIES, randomly choose between P→Q, P→¬Q, ¬P→Q, etc.
        let implicationVariant = null;
        if (operator === 'IMPLIES') {
            const variants = ['P→Q', 'P→¬Q', '¬P→Q', '¬P→¬Q'];
            implicationVariant = variants[Math.floor(Math.random() * variants.length)];
        }

        // For TAUTOLOGY, select a specific expression and store it
        if (operator === 'TAUTOLOGY') {
            this.currentTautology = Math.floor(Math.random() * 8); // 8 different expressions
        }

        const challenge = {
            operator,
            variables,
            implicationVariant,
            rows: rows.map(row => ({
                inputs: row,
                output: this.evaluateImplicationVariant(operator, row[0], row[1], implicationVariant)
            })),
            question: null,
            options: [],
            correctAnswer: null
        };

        // Create a question by hiding one output
        const hiddenIndex = Math.floor(Math.random() * 4);
        challenge.question = hiddenIndex;
        challenge.correctAnswer = challenge.rows[hiddenIndex].output;

        // Generate multiple choice options
        challenge.options = [
            { text: 'True', value: true },
            { text: 'False', value: false }
        ];

        // Store challenge data for later use
        this.currentChallengeData = challenge;
        return challenge;
    }

    evaluateExpression(operator, p, q) {
        switch (operator) {
            case 'AND': return p && q;
            case 'OR': return p || q;
            case 'NOT': return !p; // Only use first variable for NOT
            case 'IMPLIES': return !p || q; // P → Q is equivalent to ¬P ∨ Q
            case 'BICONDITIONAL': return p === q; // P ↔ Q is true when both have same value
            case 'COMPLEX': return this.evaluateComplexExpression(p, q);
            case 'TAUTOLOGY': return this.evaluateTautology(p, q);
            default: return false;
        }
    }

    evaluateTautology(p, q) {
        // Mix of tautologies (always true) and contradictions (always false)
        const expressions = [
            () => p || !p, // P ∨ ¬P (tautology)
            () => !p || p, // ¬P ∨ P (tautology)
            () => (p && q) || (!p || !q), // (P ∧ Q) ∨ (¬P ∨ ¬Q) (tautology)
            () => p && !p, // P ∧ ¬P (contradiction)
            () => !p && p, // ¬P ∧ P (contradiction)
            () => (p || q) && (!p && !q), // (P ∨ Q) ∧ (¬P ∧ ¬Q) (contradiction)
            () => (p && !q) && (!p || q), // (P ∧ ¬Q) ∧ (¬P ∨ Q) (contradiction)
            () => (p || !p) && (q || !q) // (P ∨ ¬P) ∧ (Q ∨ ¬Q) (tautology)
        ];
        
        // Use the pre-selected tautology index
        return expressions[this.currentTautology]();
    }

    getTautologyString() {
        const expressions = [
            'P ∨ ¬P',
            '¬P ∨ P',
            '(P ∧ Q) ∨ (¬P ∨ ¬Q)',
            'P ∧ ¬P',
            '¬P ∧ P',
            '(P ∨ Q) ∧ (¬P ∧ ¬Q)',
            '(P ∧ ¬Q) ∧ (¬P ∨ Q)',
            '(P ∨ ¬P) ∧ (Q ∨ ¬Q)'
        ];
        
        // Use the pre-selected tautology index
        return expressions[this.currentTautology];
    }

    evaluateImplicationVariant(operator, p, q, variant) {
        if (operator !== 'IMPLIES') {
            return this.evaluateExpression(operator, p, q);
        }
        
        switch (variant) {
            case 'P→Q': return !p || q;      // P implies Q
            case 'P→¬Q': return !p || !q;    // P implies not Q
            case '¬P→Q': return p || q;      // not P implies Q
            case '¬P→¬Q': return p || !q;    // not P implies not Q
            default: return !p || q;
        }
    }

    evaluateComplexExpression(p, q) {
        // Generate random complex expressions
        const expressions = [
            () => (p && q) || (!p && !q), // (P ∧ Q) ∨ (¬P ∧ ¬Q)
            () => !p || (p && q), // ¬P ∨ (P ∧ Q)
            () => (p || q) && !(p && q), // (P ∨ Q) ∧ ¬(P ∧ Q) - XOR equivalent
            () => (!p || q) && (!q || p), // (¬P ∨ Q) ∧ (¬Q ∨ P)
            () => !(p && !q), // ¬(P ∧ ¬Q)
        ];
        
        if (!this.currentComplexExpression) {
            this.currentComplexExpression = Math.floor(Math.random() * expressions.length);
        }
        
        return expressions[this.currentComplexExpression]();
    }

    getComplexExpressionString() {
        const expressions = [
            '(P ∧ Q) ∨ (¬P ∧ ¬Q)',
            '¬P ∨ (P ∧ Q)',
            '(P ∨ Q) ∧ ¬(P ∧ Q)',
            '(¬P ∨ Q) ∧ (¬Q ∨ P)',
            '¬(P ∧ ¬Q)'
        ];
        return expressions[this.currentComplexExpression || 0];
    }

    getTruthTableHeader(operator) {
        switch (operator) {
            case 'AND': return 'P ∧ Q';
            case 'OR': return 'P ∨ Q';
            case 'NOT': return '¬P';
            case 'IMPLIES': return this.currentChallengeData?.implicationVariant || 'P → Q';
            case 'BICONDITIONAL': return 'P ↔ Q';
            case 'COMPLEX': return this.getComplexExpressionString();
            case 'TAUTOLOGY': return this.getTautologyString();
            default: return 'Result';
        }
    }

    displayChallenge(challenge) {
        const container = document.getElementById('challenge-container');
        const questionDiv = document.getElementById('challenge-question');
        const optionsDiv = document.getElementById('challenge-options');

        console.log('Challenge data:', challenge);

        // Show challenge container
        container.classList.remove('hidden');

        // Build truth table HTML
        let tableHTML = `
            <div class="truth-table">
                <p><strong>Complete the truth table for ${challenge.operator === 'COMPLEX' ? 'complex expression' : challenge.operator === 'TAUTOLOGY' ? 'logical expression' : challenge.operator} operation:</strong></p>
                ${challenge.operator === 'COMPLEX' ? `<p><em>Expression: ${this.getComplexExpressionString()}</em></p>` : ''}
                ${challenge.operator === 'TAUTOLOGY' ? `<p><em>Expression: ${this.getTautologyString()}</em></p>` : ''}
                <table>
                    <thead>
                        <tr>
                            <th>P</th>
                            <th>Q</th>
                            <th>${this.getTruthTableHeader(challenge.operator)}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Hard-coded truth table rows
        const row0Output = this.evaluateImplicationVariant(challenge.operator, true, true, challenge.implicationVariant);
        const row1Output = this.evaluateImplicationVariant(challenge.operator, true, false, challenge.implicationVariant);
        const row2Output = this.evaluateImplicationVariant(challenge.operator, false, true, challenge.implicationVariant);
        const row3Output = this.evaluateImplicationVariant(challenge.operator, false, false, challenge.implicationVariant);

        tableHTML += `
            <tr>
                <td>T</td>
                <td>T</td>
                <td style="background-color: ${challenge.question === 0 ? '#ff8bda' : 'transparent'}; color: ${challenge.question === 0 ? 'white' : 'inherit'}; font-weight: ${challenge.question === 0 ? 'bold' : 'normal'}">${challenge.question === 0 ? '?' : (row0Output ? 'T' : 'F')}</td>
            </tr>
            <tr>
                <td>T</td>
                <td>F</td>
                <td style="background-color: ${challenge.question === 1 ? '#ff8bda' : 'transparent'}; color: ${challenge.question === 1 ? 'white' : 'inherit'}; font-weight: ${challenge.question === 1 ? 'bold' : 'normal'}">${challenge.question === 1 ? '?' : (row1Output ? 'T' : 'F')}</td>
            </tr>
            <tr>
                <td>F</td>
                <td>T</td>
                <td style="background-color: ${challenge.question === 2 ? '#ff8bda' : 'transparent'}; color: ${challenge.question === 2 ? 'white' : 'inherit'}; font-weight: ${challenge.question === 2 ? 'bold' : 'normal'}">${challenge.question === 2 ? '?' : (row2Output ? 'T' : 'F')}</td>
            </tr>
            <tr>
                <td>F</td>
                <td>F</td>
                <td style="background-color: ${challenge.question === 3 ? '#ff8bda' : 'transparent'}; color: ${challenge.question === 3 ? 'white' : 'inherit'}; font-weight: ${challenge.question === 3 ? 'bold' : 'normal'}">${challenge.question === 3 ? '?' : (row3Output ? 'T' : 'F')}</td>
            </tr>
        `;

        tableHTML += '</tbody></table></div>';
        questionDiv.innerHTML = tableHTML;

        // Display options
        optionsDiv.innerHTML = '';
        challenge.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.text;
            button.onclick = () => this.selectOption(button, option.value);
            optionsDiv.appendChild(button);
        });

        container.classList.remove('hidden');
    }

    selectOption(button, value) {
        document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        this.currentChallenge.answer = value;
    }

    startTimer() {
        this.timeLeft = 120;
        this.updateTimer();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.timeLeft;
    }

    timeUp() {
        clearInterval(this.timer);
        const correctAnswer = this.currentChallengeData ? this.currentChallengeData.correctAnswer : false;
        const explanation = this.getLogicalExplanation(this.currentChallengeData);
        this.showResult(false, `Time's up! The answer was ${correctAnswer ? 'True' : 'False'}.<br><br><strong>Explanation:</strong><br>${explanation}`);
    }

    getLogicalExplanation(challenge) {
        // Use stored challenge data if challenge parameter is incomplete
        const challengeData = challenge || this.currentChallengeData;
        if (!challengeData || !challengeData.rows) {
            return "Missing data";
        }
        
        const { operator, rows, question } = challengeData;
        const questionRow = rows[question];
        const p = questionRow.inputs[0];
        const q = questionRow.inputs[1];
        const result = questionRow.output;
        
        const pVal = p ? 'T' : 'F';
        const qVal = q ? 'T' : 'F';
        const resultVal = result ? 'T' : 'F';
        
        switch (operator) {
            case 'AND':
                return `<strong>AND:</strong> Both must be true<br>P=${pVal}, Q=${qVal} → ${resultVal}`;
                
            case 'OR':
                return `<strong>OR:</strong> At least one must be true<br>P=${pVal}, Q=${qVal} → ${resultVal}`;
                
            case 'NOT':
                return `<strong>NOT:</strong> Flips the value<br>P=${pVal} → ¬P=${resultVal}`;
                
            case 'IMPLIES':
                const variant = challengeData.implicationVariant || 'P→Q';
                return `<strong>${variant}:</strong> False only when premise=T, conclusion=F<br>P=${pVal}, Q=${qVal} → ${resultVal}`;
                
            case 'BICONDITIONAL':
                return `<strong>↔:</strong> Same values = True<br>P=${pVal}, Q=${qVal} → ${resultVal}`;
                
            case 'COMPLEX':
                return `<strong>Complex:</strong> Follow operator order<br>P=${pVal}, Q=${qVal} → ${resultVal}`;
                
            case 'TAUTOLOGY':
                const isTautology = this.evaluateTautology(pVal, qVal);
                return `<strong>Logical:</strong> ${isTautology ? 'Tautology (always true)' : 'Contradiction (always false)'}<br>P=${pVal}, Q=${qVal} → ${resultVal}`;
                
            default:
                return `Answer: ${resultVal}`;
        }
    }

    submitAnswer() {
        if (!this.currentChallenge || this.currentChallenge.answer === null) {
            alert('Please select an answer first!');
            return;
        }

        clearInterval(this.timer);
        const correctAnswer = this.currentChallengeData ? this.currentChallengeData.correctAnswer : this.currentChallenge.correctAnswer;
        const isCorrect = this.currentChallenge.answer === correctAnswer;
        
        if (isCorrect) {
            this.executeMove();
            this.playerScore += 2;
            this.showResult(true, "Correct! Great job!");
        } else {
            const explanation = this.getLogicalExplanation(this.currentChallengeData);
            this.showResult(false, `Incorrect. The answer was ${correctAnswer ? 'True' : 'False'}.<br><br><strong>Explanation:</strong><br>${explanation}`);
        }
    }

    executeMove() {
        const { fromRow, fromCol, toRow, toCol } = this.currentChallenge;
        const piece = this.board[fromRow][fromCol];
        
        // Check for capture
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        if (Math.abs(rowDiff) === 2) {
            const midRow = fromRow + rowDiff / 2;
            const midCol = fromCol + colDiff / 2;
            this.board[midRow][midCol] = null; // Remove captured piece
            this.playerScore += 5;
        }
        
        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check for king promotion
        if (piece.type === 'player' && toRow === 0) {
            piece.isKing = true;
        }
        
        this.renderBoard();
    }

    showResult(isCorrect, message) {
        const container = document.getElementById('challenge-container');
        const resultPanel = document.getElementById('result-panel');
        const resultMessage = document.getElementById('result-message');
        
        container.classList.add('hidden');
        resultPanel.className = `result-panel ${isCorrect ? 'correct' : 'incorrect'}`;
        resultMessage.innerHTML = `<h3>${message}</h3>`;
        resultPanel.classList.remove('hidden');
        
        this.updateScore();
    }

    continueGame() {
        document.getElementById('result-panel').classList.add('hidden');
        this.clearSelection();
        this.currentChallenge = null;
        
        if (this.currentPlayer === 'player') {
            this.currentPlayer = 'ai';
            setTimeout(() => this.aiTurn(), 1000);
        } else {
            this.currentPlayer = 'player';
        }
    }

    aiTurn() {
        // Simple AI: make a random valid move
        const aiPieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'ai') {
                    aiPieces.push({ row, col, piece });
                }
            }
        }
        
        if (aiPieces.length === 0) {
            this.endGame('player');
            return;
        }
        
        // Find valid moves for AI
        const validMoves = [];
        aiPieces.forEach(({ row, col }) => {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (this.isValidMove(row, col, r, c)) {
                        validMoves.push({ fromRow: row, fromCol: col, toRow: r, toCol: c });
                    }
                }
            }
        });
        
        if (validMoves.length === 0) {
            this.endGame('player');
            return;
        }
        
        // AI makes a random move (always "solves" the problem correctly)
        const move = validMoves[Math.floor(Math.random() * validMoves.length)];
        const piece = this.board[move.fromRow][move.fromCol];
        
        // Check for capture
        const rowDiff = move.toRow - move.fromRow;
        const colDiff = move.toCol - move.fromCol;
        if (Math.abs(rowDiff) === 2) {
            const midRow = move.fromRow + rowDiff / 2;
            const midCol = move.fromCol + colDiff / 2;
            this.board[midRow][midCol] = null;
            this.aiScore += 5;
        }
        
        // Move piece
        this.board[move.toRow][move.toCol] = piece;
        this.board[move.fromRow][move.fromCol] = null;
        
        // Check for king promotion
        if (piece.type === 'ai' && move.toRow === 7) {
            piece.isKing = true;
        }
        
        this.aiScore += 2;
        this.renderBoard();
        this.updateScore();
        this.currentPlayer = 'player';
    }

    skipChallenge() {
        clearInterval(this.timer);
        this.playerScore = Math.max(0, this.playerScore - 1);
        const correctAnswer = this.currentChallengeData ? this.currentChallengeData.correctAnswer : false;
        const explanation = this.getLogicalExplanation(this.currentChallengeData);
        this.showResult(false, `Challenge skipped. -1 point.<br><br>The answer was ${correctAnswer ? 'True' : 'False'}.<br><br><strong>Explanation:</strong><br>${explanation}`);
    }

    updateScore() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
    }

    newGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'player';
        this.selectedPiece = null;
        this.gameState = 'playing';
        this.playerScore = 0;
        this.aiScore = 0;
        this.currentChallenge = null;
        
        document.getElementById('challenge-container').classList.add('hidden');
        document.getElementById('result-panel').classList.add('hidden');
        
        this.initializeGame();
    }

    endGame(winner) {
        this.gameState = 'ended';
        this.showGameEndModal(winner);
    }

    showGameEndModal(winner) {
        const isPlayerWin = winner === 'player';
        const title = isPlayerWin ? '🎉 Congratulations!' : '💭 Game Over';
        const message = isPlayerWin ? 'You won! Great job solving those truth tables!' : 'AI wins this time. Try again!';
        const emoji = isPlayerWin ? '🏆' : '🤖';
        
        // Create modal HTML
        const modalHTML = `
            <div id="game-end-modal" class="modal">
                <div class="modal-content game-end-content">
                    <div class="game-end-header">
                        <div class="game-end-emoji">${emoji}</div>
                        <h2>${title}</h2>
                    </div>
                    <p class="game-end-message">${message}</p>
                    <div class="game-end-stats">
                        <div class="stat-item">
                            <span class="stat-label">Your Score:</span>
                            <span class="stat-value">${this.playerScore}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">AI Score:</span>
                            <span class="stat-value">${this.aiScore}</span>
                        </div>
                    </div>
                    <div class="game-end-buttons">
                        <button id="play-again" class="btn primary">Play Again</button>
                        <button id="close-game-end" class="btn secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        const modal = document.getElementById('game-end-modal');
        const playAgainBtn = document.getElementById('play-again');
        const closeGameEndBtn = document.getElementById('close-game-end');
        
        // Close modal handlers
        const closeModal = () => {
            modal.remove();
        };
        
        closeGameEndBtn.addEventListener('click', closeModal);
        playAgainBtn.addEventListener('click', () => {
            closeModal();
            this.newGame();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    setupEventListeners() {
        document.getElementById('submit-answer').addEventListener('click', () => this.submitAnswer());
        document.getElementById('skip-challenge').addEventListener('click', () => this.skipChallenge());
        document.getElementById('continue-game').addEventListener('click', () => this.continueGame());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        
        // Rules modal
        const rulesBtn = document.getElementById('rules');
        const modal = document.getElementById('rules-modal');
        const closeBtn = modal.querySelector('.close');
        
        rulesBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
        
        // Hint button
        document.getElementById('hint').addEventListener('click', () => {
            this.showHint();
        });

        // Welcome modal functionality
        this.setupWelcomeModal();
    }

    setupWelcomeModal() {
        const welcomeModal = document.getElementById('welcome-modal');
        const startGameBtn = document.getElementById('start-game');
        const welcomeCloseBtn = welcomeModal.querySelector('.close');

        // Close welcome modal when start game is clicked
        startGameBtn.addEventListener('click', () => {
            welcomeModal.classList.add('hidden');
        });

        // Close welcome modal with X button
        welcomeCloseBtn.addEventListener('click', () => {
            welcomeModal.classList.add('hidden');
        });

        // Close welcome modal when clicking outside
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) {
                welcomeModal.classList.add('hidden');
            }
        });
    }

    showHint() {
        if (!this.currentChallengeData) {
            alert('Start a challenge first to get hints!');
            return;
        }

        const { operator, implicationVariant } = this.currentChallengeData;
        let hint = this.getHintForOperator(operator, implicationVariant);
        
        // Create hint modal
        const hintModal = document.createElement('div');
        hintModal.className = 'modal';
        hintModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>💡 Hint</h2>
                <div class="hint-content">
                    ${hint}
                </div>
            </div>
        `;
        
        document.body.appendChild(hintModal);
        
        // Add close functionality
        const closeBtn = hintModal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(hintModal);
        });
        
        hintModal.addEventListener('click', (e) => {
            if (e.target === hintModal) {
                document.body.removeChild(hintModal);
            }
        });
    }

    getHintForOperator(operator, implicationVariant) {
        switch (operator) {
            case 'AND':
                return `
                    <p><strong>AND (∧) Operator:</strong></p>
                    <p>• Returns <strong>true</strong> only when BOTH inputs are true</p>
                    <p>• Think: "P AND Q" - both conditions must be met</p>
                    <p>• Example: "It's sunny AND warm" is only true if both are true</p>
                `;
            
            case 'OR':
                return `
                    <p><strong>OR (∨) Operator:</strong></p>
                    <p>• Returns <strong>true</strong> when AT LEAST ONE input is true</p>
                    <p>• Think: "P OR Q" - either condition (or both) can be met</p>
                    <p>• Example: "Bring an umbrella OR sunglasses" - you need at least one</p>
                `;
            
            case 'NOT':
                return `
                    <p><strong>NOT (¬) Operator:</strong></p>
                    <p>• Returns the <strong>opposite</strong> of the input</p>
                    <p>• If P is true, ¬P is false</p>
                    <p>• If P is false, ¬P is true</p>
                    <p>• Think: "NOT raining" means it's not raining</p>
                `;
            
            case 'IMPLIES':
                if (implicationVariant) {
                    return `
                        <p><strong>Implication (${implicationVariant}):</strong></p>
                        <p>• An implication is <strong>false</strong> only when the premise is true but the conclusion is false</p>
                        <p>• For ${implicationVariant}:</p>
                        ${this.getImplicationVariantHint(implicationVariant)}
                        <p>• Remember: "If false, then anything" is always true!</p>
                    `;
                } else {
                    return `
                        <p><strong>IMPLIES (→) Operator:</strong></p>
                        <p>• P→Q is <strong>false</strong> only when P is true and Q is false</p>
                        <p>• Think: "If it rains, then I'll bring an umbrella"</p>
                        <p>• Only false if it rains but I don't bring an umbrella</p>
                    `;
                }
            
            case 'BICONDITIONAL':
                return `
                    <p><strong>BICONDITIONAL (↔) Operator:</strong></p>
                    <p>• Returns <strong>true</strong> when both inputs have the SAME truth value</p>
                    <p>• P↔Q means "P if and only if Q"</p>
                    <p>• True when: (P=true, Q=true) or (P=false, Q=false)</p>
                    <p>• Think: "The light is on if and only if the switch is up"</p>
                `;
            
            case 'COMPLEX':
                return `
                    <p><strong>COMPLEX Expression:</strong></p>
                    <p>• Break down the expression step by step</p>
                    <p>• Work from inside parentheses outward</p>
                    <p>• Apply operator precedence: NOT, then AND, then OR</p>
                    <p>• Substitute the truth values and evaluate each part</p>
                `;
            
            case 'TAUTOLOGY':
                return `
                    <p><strong>LOGICAL EXPRESSIONS (⊤/⊥):</strong></p>
                    <p>• <strong>Tautologies</strong> are ALWAYS true (e.g., P ∨ ¬P)</p>
                    <p>• <strong>Contradictions</strong> are ALWAYS false (e.g., P ∧ ¬P)</p>
                    <p>• Look at the expression carefully to determine which type it is</p>
                    <p>• Think: "Is this logically possible to be false/true?"</p>
                `;
            
            default:
                return `
                    <p><strong>General Tip:</strong></p>
                    <p>• Read the expression carefully</p>
                    <p>• Substitute the given truth values</p>
                    <p>• Apply the operator rules step by step</p>
                `;
        }
    }

    getImplicationVariantHint(variant) {
        switch (variant) {
            case 'P→Q':
                return '<p>• False only when P=true and Q=false</p>';
            case 'P→¬Q':
                return '<p>• False only when P=true and Q=true (since ¬Q would be false)</p>';
            case '¬P→Q':
                return '<p>• False only when P=false (so ¬P=true) and Q=false</p>';
            case '¬P→¬Q':
                return '<p>• False only when P=false (so ¬P=true) and Q=true (so ¬Q=false)</p>';
            default:
                return '<p>• Apply the implication rule to the specific variant</p>';
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TruthTableCheckers();
});
