(function () {
    const textarea = document.getElementById('tt-players');
    const startBtn = document.getElementById('tt-start');
    const undoBtn = document.getElementById('tt-undo');
    const bracketContainer = document.getElementById('tt-bracket');
    const messageEl = document.getElementById('tt-message');
    const randomiseBtn = document.getElementById('tt-randomise');

    if (randomiseBtn) {
        randomiseBtn.addEventListener('click', function () {
            let players = parsePlayers(textarea.value);

            if (players.length < 2) {
                alert("Enter at least two players before randomising.");
                return;
            }

            shuffleArray(players);

            textarea.value = players.join("\n");

            // Optional: auto-generate bracket after shuffle
            // history = [];
            // initBracket(players);

            if (messageEl) {
                messageEl.innerHTML = "Player order randomised.";
            }
        });
    }


    if (!textarea || !startBtn || !bracketContainer) {
        return;
    }

    // State: rounds[roundIndex][matchIndex] = { p1, p2, winner }
    let rounds = [];
    let history = []; // stack of previous rounds snapshots

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

    function parsePlayers(raw) {
        return raw
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    function nextPowerOfTwo(n) {
        return Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))));
    }

    function initBracket(players) {
        const n = players.length;
        if (n < 2) {
            rounds = [];
            bracketContainer.innerHTML = "";
            if (messageEl) {
                messageEl.innerHTML = "Please enter at least two names.";
            }
            return;
        }

        const size = nextPowerOfTwo(n);
        const byes = size - n;

        // Round 0 matches
        const firstRound = [];
        let idx = 0;

        for (let i = 0; i < size; i += 2) {
            const p1 = players[idx++] || null;
            const p2 = players[idx++] || null;

            // If there are byes, we distribute them at the end (null players)
            firstRound.push({
                p1: p1,
                p2: p2,
                winner: null
            });
        }

        // Create empty rounds up to final
        const totalRounds = Math.log2(size);
        rounds = [];
        rounds.push(firstRound);

        for (let r = 1; r < totalRounds; r++) {
            // r = 1 → size / 4 (e.g. 16 / 4 = 4 matches)
            // r = 2 → size / 8 (2 matches)
            // r = 3 → size / 16 (1 match)
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


        // If there's only one round, winners become champion directly
        // otherwise, auto-advance any byes:
        autoAdvanceByes();
        renderBracket();
        if (messageEl) {
            messageEl.innerHTML = "";
        }
    }

    function autoAdvanceByes() {
        const firstRound = rounds[0];
        for (let i = 0; i < firstRound.length; i++) {
            const match = firstRound[i];
            if (match.p1 && !match.p2) {
                // p1 gets bye
                match.winner = match.p1;
                propagateWinner(0, i, match.p1, false);
            } else if (!match.p1 && match.p2) {
                // p2 gets bye
                match.winner = match.p2;
                propagateWinner(0, i, match.p2, false);
            }
        }
    }

    function propagateWinner(roundIndex, matchIndex, winner, saveHistory = true) {
        const isLastRound = roundIndex === rounds.length - 1;
        if (isLastRound) {
            // Final winner, nothing to propagate
            return;
        }

        const nextRoundIndex = roundIndex + 1;
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const isTop = (matchIndex % 2 === 0); // even => fills p1, odd => p2

        const nextMatch = rounds[nextRoundIndex][nextMatchIndex];
        if (!nextMatch) return;

        if (saveHistory) pushHistory();

        if (isTop) {
            nextMatch.p1 = winner;
        } else {
            nextMatch.p2 = winner;
        }

        // If this overwrote a previous winner in the next round, clear downstream winners
        nextMatch.winner = null;
        clearDownstream(nextRoundIndex, nextMatchIndex);

        renderBracket();
    }

    function clearDownstream(roundIndex, matchIndex) {
        for (let r = roundIndex + 1; r < rounds.length; r++) {
            const matches = rounds[r];
            for (let m = 0; m < matches.length; m++) {
                const match = matches[m];
                // If this match depends on earlier rounds, just reset everything.
                match.p1 = match.p1;
                match.p2 = match.p2;
                match.winner = null;
            }
        }
    }

    function handleWinnerClick(roundIndex, matchIndex, playerSlot) {
        const match = rounds[roundIndex][matchIndex];
        if (!match) return;

        const winner = playerSlot === 1 ? match.p1 : match.p2;
        if (!winner) return;

        // If winner is already set to this, do nothing
        if (match.winner === winner) return;

        pushHistory();
        match.winner = winner;

        // Clear downstream and propagate
        clearDownstream(roundIndex, matchIndex);
        propagateWinner(roundIndex, matchIndex, winner, false);
        renderBracket();
    }

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

            if (match.winner && match.winner === player) {
                if (match.winner === player) {
                    row.classList.add('winner');
                } else {
                    row.classList.add('loser');
                }
            }

            // If match is resolved, highlight the match box
            if (match.winner) {
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
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
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

        // Show final winner if determined
        const lastRound = rounds[rounds.length - 1];
        if (lastRound && lastRound[0] && lastRound[0].winner) {
            if (messageEl) {
                messageEl.innerHTML = `<span class="bracket-final-winner">Winner: ${lastRound[0].winner}</span>`;
            }
        } else if (messageEl) {
            messageEl.innerHTML = '';
        }
    }

    // Event wiring
    startBtn.addEventListener('click', function () {
        const players = parsePlayers(textarea.value);
        history = [];
        if (undoBtn) undoBtn.disabled = true;
        initBracket(players);
    });

    if (undoBtn) {
        undoBtn.addEventListener('click', function () {
            restoreFromHistory();
        });
    }
})();
