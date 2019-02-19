const { ipcRenderer } = require('electron');

ipcRenderer.on('ready', () => {
    ipcRenderer.send('loadWaitingVotes', '');
    ipcRenderer.on('successLoadWaitingVotes', (event, args) => {
        let select = document.getElementById('waitingVotes');
        for (let i = 0; i < args.length; ++i) {
            option = document.createElement('option');
            option.value = args[i].voteName;
            option.text = args[i].voteName + ' - ikke startet';
            select.add(option);
        }
    });
});

function startVote() {
    let e = document.getElementById("waitingVotes");
    let selectedVoteName = e.options[e.selectedIndex].value;
    let fullScreen = document.getElementById('fullscreen').checked;
    
    ipcRenderer.send('startVote', {voteName: selectedVoteName, fullScreen: fullScreen});
}

function menu() {
    ipcRenderer.send('enterMenu', '');
}