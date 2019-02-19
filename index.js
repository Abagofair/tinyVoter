const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');
const md5 = require('md5');
const util = require('util');
const { app, BrowserWindow, ipcMain } = require('electron');

let votesOnDisk = [];
function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ minimizable: true, maximizable: true, resizable: true });
    // win.setMenu(null);
    votesOnDisk = findVotesOnDisk();
    if (votesOnDisk === undefined) {
        votesOnDisk = [];
    }
    console.log(util.inspect(votesOnDisk, false, null));
    win.maximize();
    // and load the index.html of the app.
    win.loadFile('./public/main.html');
}

let tempVote = {
    voteName: 'temp-' + uuid(),
    password: undefined,
    progress: 'waiting',
    voteParts: []
};


function resetVote() {
    tempVote = {
        voteName: 'temp-' + uuid(),
        password: undefined,
        progress: 'waiting',
        voteParts: []
    };
}

function findVotePart(partName) {
    let parts = tempVote.voteParts;
    for (let i = 0; i < parts.length; ++i) {
        if (parts[i].partName === partName) {
            return parts[i];
        }
    }
    return undefined;
}

function findVotesOnDisk() {
    let votes = [];
    let files = fs.readdirSync('./votes');
    for (let i = 0; i < files.length; ++i) {
        let voteName = files[i].split('-')[0];
        votes.push(voteName);
    }
    return votes;
}

ipcMain.on('saveVote', (event, args) => {
    tempVote.voteName = args.voteName;
    tempVote.password = md5(args.password);
    //write vote to disk
    if (!fs.existsSync('./votes')) { //hmm
        fs.mkdirSync('./votes');
    }
    let json = {
        voteInfo: {
            name: tempVote.voteName,
            password: tempVote.password,
            progress: tempVote.progress
        },
        voteParts: JSON.stringify(tempVote.voteParts)
    }
    let buffer = Buffer.from(JSON.stringify(json)).toString('base64');
    fs.writeFile(__dirname + "/votes/" + tempVote.voteName + '-' + uuid() + '.vote',
        buffer, 'utf-8', function (err) {
            if (err) {
                event.sender.send('errorSaveVote', '');
                return;
            }
            event.sender.send('successSaveVote', '');
            resetVote();
            win.reload();
        });
});

ipcMain.on('loadWaitingVotes', (event, args) => {
    votesOnDisk = findVotesOnDisk();
    if (votesOnDisk === undefined) {
        votesOnDisk = [];
        event.sender.send('errorLoadWaitingVotes', '');
        return;
    }
    let waitingVotes = [];
    for (let i = 0; i < votesOnDisk.length; ++i) {
        let vote = loadVote(votesOnDisk[i]);
        if (vote.progress === 'waiting') {
            waitingVotes.push(vote);
        }
    }
    event.sender.send('successLoadWaitingVotes', waitingVotes);
});

function loadVote(args) {
    let selectedVote = args;
    let voteOnDisk = votesOnDisk.find((elem) => {
        return selectedVote === elem;
    });

    if (voteOnDisk === undefined) {
        return undefined;
    }

    let files = fs.readdirSync('./votes');
    let fileName = __dirname + '\\votes\\';
    for (let i = 0; i < files.length; ++i) {
        let voteName = files[i].split('-')[0];
        if (voteName === selectedVote) {
            fileName = fileName + files[i];
        }
    }

    if (fileName !== undefined || fileName.length >= 1) {
        let voteFromDisk = fs.readFileSync(fileName, 'utf-8');
        let jsonString = Buffer.from(voteFromDisk, 'base64').toString('utf-8');
        let jsonVoteFromDisk = JSON.parse(jsonString);
        tempVote.voteName = jsonVoteFromDisk.voteInfo.name;
        tempVote.password = jsonVoteFromDisk.voteInfo.password;
        tempVote.progress = jsonVoteFromDisk.voteInfo.progress;
        tempVote.voteParts = JSON.parse(jsonVoteFromDisk.voteParts);
        return tempVote;
        //event.sender.send('successLoadVote', tempVote);
    }
    else {
        return undefined;
        //event.sender.send('errorLoadVote', '');
    }
}

ipcMain.on('loadVote', (event, args) => {
    let vote = loadVote(args);
    if (vote === undefined) {
        event.sender.send('errorLoadVote', '');
    }
    else {
        event.sender.send('successLoadVote', vote);
    }
});

ipcMain.on('newPart', (event, args) => {
    tempVote.voteParts.push(args);
    console.log(require('util').inspect(tempVote, null, false));
    for (let i = 0; i < tempVote.voteParts.length; ++i) {
        console.log(require('util').inspect(tempVote.voteParts[i], null, false));
        for (let j = 0; j < tempVote.voteParts[i].voteOptions.length; ++j) {
            console.log(require('util').inspect(tempVote.voteParts[i].voteOptions[j], null, false));
        }
    }
});

ipcMain.on('startVote', (event, args) => {
    let fullScreen = args.fullScreen;
    let voteName = args.voteName;

    let loadedVote = loadVote(voteName);
    win.loadFile('./public/vote.html');
    win.setFullScreen(fullScreen);
    win.webContents.once('dom-ready', () => {
        event.sender.send('ready', loadedVote);
    });
});

ipcMain.on('overwritePart', (event, args) => {
    let votePart = findVotePart(args.partName);
    votePart.voteOptions = args.voteOptions;
});

ipcMain.on('changeView', (event, args) => {
    if (args === 'createVote') {
        win.loadFile('./public/createVote.html');
        win.webContents.once('dom-ready', () => {
            event.sender.send('tempVote', tempVote);
        });
    }
    else if (args === 'startVote') {
        win.loadFile('./public/selectVote.html');
        win.webContents.once('dom-ready', () => {
            event.sender.send('ready', '');
        });
    }
});

ipcMain.on('enterMenu', (event, args) => {
    win.loadFile('./public/main.html');
});

ipcMain.on('killProgram', (event, args) => {
    app.quit();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('ready', createWindow);