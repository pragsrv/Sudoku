const puzzle = [
  [5, 3, '', '', 7, '', '', '', ''],
  [6, '', '', 1, 9, 5, '', '', ''],
  ['', 9, 8, '', '', '', '', 6, ''],
  [8, '', '', '', 6, '', '', '', 3],
  [4, '', '', 8, '', 3, '', '', 1],
  [7, '', '', '', 2, '', '', '', 6],
  ['', 6, '', '', '', '', 2, 8, ''],
  ['', '', '', 4, 1, 9, '', '', 5],
  ['', '', '', '', 8, '', '', 7, 9]
];

const board = document.getElementById("board");

function createBoard() {
  board.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("input");
      cell.className = "cell";
      cell.maxLength = 1;

      const value = puzzle[row][col];
      if (value !== '') {
        cell.value = value;
        cell.disabled = true;
      } else {
        cell.addEventListener("input", (e) => {
          const val = e.target.value;
          if (!/^[1-9]$/.test(val)) {
            e.target.value = '';
          }
        });
      }
      board.appendChild(cell);
    }
  }
}

createBoard();
