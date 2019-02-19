const {ipcRenderer} = require('electron');
function changeView(id) {
    ipcRenderer.send('changeView', id);
}

function loadVote() {
    ipcRenderer.send('loadWaitingVotes', '');
}

function kill() {
    ipcRenderer.send('killProgram', '');
}