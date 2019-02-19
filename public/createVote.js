const { ipcRenderer } = require('electron');

let currentOption = 4;
let tempVote = {};

ipcRenderer.on('tempVote', (event, arg) => {
    console.log(arg);
    tempVote = arg;
    document.getElementById('subTitle').innerText = tempVote.voteName;
    for (let i = 0; i < tempVote.voteParts.length; ++i) {
        addExistingPart(tempVote.voteParts[i]);
    }
});

function findVotePart(partName) {
    let parts = tempVote.voteParts;
    //console.log('parts[i].partName ' + parts[i].partName);
    for (let i = 0; i < parts.length; ++i) {
        if (parts[i].partName === partName) {
            return parts[i];
        }
    }
    return undefined;
}

function displayExistingPart(e) {
    resetPartCreation();
    let partToDisplay = findVotePart(e.target.id);

    if (partToDisplay === undefined || partToDisplay === null) {
        console.log('øasd');
        return;
    }
    document.getElementById('partName').value = partToDisplay.partName;

    for (let i = 1; i <= partToDisplay.voteOptions.length; ++i) {
        let option = document.getElementById('option' + i);
        if (option === undefined || option === null) {
            addOption();
            option = document.getElementById('option' + currentOption);
        }
        option.value = partToDisplay.voteOptions[i - 1].optionName;
    }
}

function addExistingPart(part) {
    let newPart = document.createElement("a");
    newPart.innerText = 'Delnavn: ' + part.partName;
    newPart.style = "margin: 10px 10px 10px 0px";
    newPart.id = part.partName;
    newPart.onclick = displayExistingPart;
    document.getElementById('existingParts').appendChild(newPart);
    let lineBreak = document.createElement("br");
    document.getElementById('existingParts').appendChild(lineBreak);
}

function createOptionElement(adjacentElement) {
    ++currentOption;
    let label = document.createElement("label");
    let option = document.createElement("input");
    label.htmlFor = "option" + currentOption;
    label.innerText = 'Valgmulighed';
    label.className = 'partLbl';
    label.htmlFor = 'option' + currentOption;
    option.id = 'option' + currentOption;
    option.type = "text";
    option.className = 'partOption';
    adjacentElement.insertAdjacentElement('afterend', label);
    label.insertAdjacentElement('afterend', option);
}

function resetPartCreation() {
    currentOption = 4;
    document.getElementById('partName').value = '';
    let labels = document.getElementsByClassName('partLbl');
    for (let i = 0; i < labels.length; ++i) {
        let id = Number.parseInt(labels[i].htmlFor.substring('option'.length));
        if (id > currentOption) {
            document.getElementById('partCreation').removeChild(labels[i]);
        }
    }
    let parts = document.getElementsByClassName('partOption');
    for (let i = 0; i < parts.length; ++i) {
        let id = Number.parseInt(parts[i].id.substring('option'.length));
        if (id > currentOption) {
            document.getElementById('partCreation').removeChild(parts[i]);
        }
        else {
            parts[i].value = '';
        }
    }
}

function addOption() {
    let addOptionElem = document.getElementById('option' + currentOption);
    createOptionElement(addOptionElem);
}

function createPart() {
    let partName = document.getElementById('partName').value;
    if (partName.length < 1) {
        alert('Der mangler et delnavn');
        return;
    }
    let votePart = findVotePart(partName);
    let overwrite = false;
    if (votePart !== undefined) {
        overwrite = confirm('Delnavn ' + partName + ' eksisterer allerede. Overskriv?');
    }

    let part = {
        partName: partName,
        voteOptions: []
    };

    let parts = document.getElementsByClassName('partOption');
    for (let i = 0; i < parts.length; ++i) {
        let optionName = parts[i].value;
        if (optionName.length >= 1) {
            let voteOption = {
                optionName: optionName,
                voteCount: 0
            };
            part.voteOptions.push(voteOption);
        }
    }

    if (overwrite) {
        ipcRenderer.send('overwritePart', part);
        votePart.voteOptions = part.voteOptions;
        resetPartCreation();
    }
    else if (votePart === undefined) {
        ipcRenderer.send('newPart', part);
        tempVote.voteParts.push(part);
        addExistingPart(part);
        resetPartCreation();
    }
}

function menu() {
    ipcRenderer.send('enterMenu', '');
}

function saveVote() {
    let voteName = document.getElementById('voteName').value;
    let password = document.getElementById('password').value;

    let msg = '';
    if (voteName === undefined || voteName.length < 1) {
        msg = msg + 'Afstemningen skal have et navn - ';
        if (passWord === undefined || passWord.length < 1) {
            msg = msg + 'Indtast et kodeord';
        }
        alert(msg);
        return;
    }

    ipcRenderer.send('saveVote', {voteName: voteName, password: password});
}

ipcRenderer.on('successSaveVote', () => {
    tempVote = {};
    alert('Afstemningen er blevet gemt');
});

ipcRenderer.on('errorSaveVote', () => {
    alert('Fejl i forsøget på at gemme afstemningen');
});