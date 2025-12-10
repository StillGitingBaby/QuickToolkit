(function () {
    const textarea = document.getElementById('tt-players');
    const startBtn = document.getElementById('tt-start');
    const undoBtn = document.getElementById('tt-undo');
    const bracketContainer = document.getElementById('tt-bracket');
    const messageEl = document.getElementById('tt-message');
    const randomiseBtn = document.getElementById('tt-randomise');
    const playerCountEl = document.getElementById('tt-player-count');

    if (!textarea || !startBtn || !bracketContainer) {
        return;
    }

    // ===============================
    // State
    // ===============================

    // rounds[roundIndex][matchIndex] = { p1, p2, winner }
    let rounds = [];
    let history = []; // stack of previous states for undo

    function cloneRounds(r) {
        return JSON.parse(JSON.stringify(r));
    }

    function pushHistory() {
        history.push(cloneRounds(rounds));
        if (undoBtn) {
            undoBtn.disabled = history.length === 0;
        }
    }

    function restoreFromHistory() {
        if (history.length === 0) return;
        rounds = history.pop();
        renderBracket();
        if (undoBtn) {
            undoBtn.disabled = history.length === 0;
        }
    }

    // ===============================
    // Helpers
    // ===============================

    function parsePlayers(raw) {
        return raw
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    function updatePlayerCount() {
        if (!playerCountEl) return;
        const count = parsePlayers(textarea.value).length;

        if (count === 0) {
            playerCountEl.textContent = "No players yet";
        } else if (count === 1) {
            playerCountEl.textContent = "1 player";
        } else {
            playerCountEl.textContent = count + " players";
        }
    }

    function nextPowerOfTwo(n) {
        return Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))));
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // ===============================
    // Bracket initialisation
    // ===============================

    function initBracket(players) {
        const n = players.length;
        if (n < 2) {
            rounds = [];
            bracketContainer.innerHTML = "";
            if (messageEl) {
                messageEl.textContent = "Please enter at least two names.";
            }
            return;
        }

        const size = nextPowerOfTwo(n);        // total slots in round 1
        const firstRound = [];
        let idx = 0;

        // Build round 1, padding with nulls (byes)
        for (let i = 0; i < size; i += 2) {
            const p1 = players[idx++] || null;
            const p2 = players[idx++] || null;

            firstRound.push({
                p1: p1,
                p2: p2,
                winner: null
            });
        }

        const totalRounds = Math.log2(size);

        rounds = [];
        rounds.push(firstRound);

        // Empty later rounds
        for (let r = 1; r < totalRounds; r++) {
            const matchesInRound = size / Math.pow(2, r + 1);
            const roundMatches = [];
            for (let m = 0; m < matchesInRound; m++) {
                roundMatches.push({
                    p1: null,
                    p2: null,
                    winner: null
                });
            }
            rounds.push(roundMatches);
        }

        autoAdvanceByes();
        renderBracket();
        if (messageEl) {
            messageEl.textContent = "";
        }
    }

    function autoAdvanceByes() {
        const firstRound = rounds[0];
        for (let i = 0; i < firstRound.length; i++) {
            const match = firstRound[i];
            if (match.p1 && !match.p2) {
                match.winner = match.p1;
                propagateWinner(0, i, match.p1, false);
            } else if (!match.p1 && match.p2) {
                match.winner = match.p2;
                propagateWinner(0, i, match.p2, false);
            }
        }
    }

    // ===============================
    // Propagation
    // ===============================

    function propagateWinner(roundIndex, matchIndex, winner, saveHistory = true) {
        const isLastRound = roundIndex === rounds.length - 1;
        if (isLastRound) {
            // Final winner, nothing to propagate
            return;
        }

        const nextRoundIndex = roundIndex + 1;
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isTop = (matchIndex % 2 === 0); // even => p1, odd => p2

        const nextMatch = rounds[nextRoundIndex][nextMatchIndex];
        if (!nextMatch) return;

        if (saveHistory) pushHistory();

        if (isTop) {
            nextMatch.p1 = winner;
        } else {
            nextMatch.p2 = winner;
        }

        // Clear winners in later rounds (but keep assigned players)
        nextMatch.winner = null;
        clearDownstream(nextRoundIndex, nextMatchIndex);

        renderBracket();
    }

    function clearDownstream(roundIndex, matchIndex) {
        for (let r = roundIndex + 1; r < rounds.length; r++) {
            const matches = rounds[r];
            for (let m = 0; m < matches.length; m++) {
                matches[m].winner = null;
            }
        }
    }

    // ===============================
    // Interaction
    // ===============================

    function handleWinnerClick(roundIndex, matchIndex, playerSlot) {
        const match = rounds[roundIndex][matchIndex];
        if (!match) return;

        const winner = playerSlot === 1 ? match.p1 : match.p2;
        if (!winner) return;

        if (match.winner === winner) return;

        pushHistory();
        match.winner = winner;

        clearDownstream(roundIndex, matchIndex);
        propagateWinner(roundIndex, matchIndex, winner, false);
        renderBracket();
    }

    // ===============================
    // DOM building
    // ===============================

    function buildMatchElement(roundIndex, matchIndex, match) {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'bracket-match';

        const isEmpty = !match.p1 && !match.p2;
        if (isEmpty) {
            matchDiv.classList.add('empty');
        }

        function makePlayerRow(player, slot) {
            const row = document.createElement('div');
            row.className = 'bracket-player';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'bracket-player-name';
            nameSpan.textContent = player || '—';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = 'Win';
            btn.disabled = !player;

            if (match.winner) {
                if (match.winner === player) {
                    row.classList.add('winner');
                } else {
                    row.classList.add('loser');
                }
                matchDiv.classList.add('resolved');
            }

            btn.addEventListener('click', function () {
                handleWinnerClick(roundIndex, matchIndex, slot);
            });

            row.appendChild(nameSpan);
            row.appendChild(btn);
            return row;
        }

        matchDiv.appendChild(makePlayerRow(match.p1, 1));
        matchDiv.appendChild(makePlayerRow(match.p2, 2));

        return matchDiv;
    }

    function renderBracket() {
        bracketContainer.innerHTML = '';

        if (!rounds || rounds.length === 0) {
            return;
        }

        rounds.forEach((round, rIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'bracket-round';

            const title = document.createElement('div');
            title.className = 'bracket-round-title';

            if (rIndex === rounds.length - 1) {
                title.textContent = 'Final';
            } else if (rIndex === rounds.length - 2) {
                title.textContent = 'Semi-finals';
            } else if (rIndex === 0) {
                title.textContent = 'Round 1';
            } else {
                title.textContent = `Round ${rIndex + 1}`;
            }

            roundDiv.appendChild(title);

            round.forEach((match, mIndex) => {
                const matchEl = buildMatchElement(rIndex, mIndex, match);
                roundDiv.appendChild(matchEl);
            });

            bracketContainer.appendChild(roundDiv);
        });

        const lastRound = rounds[rounds.length - 1];
        if (lastRound && lastRound[0] && lastRound[0].winner) {
            if (messageEl) {
                messageEl.innerHTML = `<span class="bracket-final-winner">Winner: ${lastRound[0].winner}</span>`;
            }
        } else if (messageEl) {
            messageEl.textContent = '';
        }
    }

    // ===============================
    // Randomise seed button
    // ===============================

    if (randomiseBtn) {
        randomiseBtn.addEventListener('click', function () {
            let players = parsePlayers(textarea.value);

            if (players.length < 2) {
                alert("Enter at least two players before randomising.");
                return;
            }

            shuffleArray(players);
            textarea.value = players.join("\n");
            updatePlayerCount();

            if (messageEl) {
                messageEl.textContent = "Player order randomised.";
            }
        });
    }

    // ===============================
    // Event wiring
    // ===============================

    startBtn.addEventListener('click', function () {
        const players = parsePlayers(textarea.value);
        history = [];
        if (undoBtn) undoBtn.disabled = true;
        initBracket(players);
        updatePlayerCount();
    });

    if (undoBtn) {
        undoBtn.addEventListener('click', function () {
            restoreFromHistory();
        });
    }

    textarea.addEventListener('input', updatePlayerCount);

    // Initial count
    updatePlayerCount();
})();
