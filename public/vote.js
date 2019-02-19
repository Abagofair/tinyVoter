const { ipcRenderer } = require('electron');

let currentPart = 0;
let voteCount = 2;
let currentVote = {};

ipcRenderer.on('ready', (event, vote) => {
    currentVote = vote;
    console.log(currentVote);
    buildVotePart();
});

function buildVotePart() {
    let table = document.getElementById('voteBoxBody');
    let votePart = currentVote.voteParts[currentPart];
    let partName = votePart.partName;
    let voteOptions = votePart.voteOptions;

    for (let i = 0; i < voteOptions.length; ++i) {
        let tr = document.createElement('tr');
        let tdName = document.createElement('td');
        tdName.innerText = voteOptions[i].optionName;
        let tdPartName = document.createElement('td');
        tdPartName.innerText = partName;
        let checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        tr.appendChild(tdName);
        tr.appendChild(tdPartName);
        tr.appendChild(checkBox);
        table.appendChild(tr);
    }
}

function menu() {
    ipcRenderer.send('enterMenu', '');
}