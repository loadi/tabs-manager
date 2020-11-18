const port = chrome.runtime.connect();
const saveButton = document.getElementById("save");
const loadButton = document.getElementById("load");


function save(name){
    port.postMessage({save: name});
}

function clearTempButtons(){
    Object.values(document.getElementsByClassName("tempButton")).forEach(button => {
        button.remove();
    });
}

function clearTempP(){
    Object.values(document.getElementsByClassName("tempP")).forEach(button => {
        button.remove();
    });
}

function getSessionData(sessionName){
    port.postMessage({getSession: sessionName});
}

function delSession(sessionName){
    port.postMessage({delSession: sessionName});
    clearTempButtons();
    clearTempP();
    toMain();
}

function showSessionData(sessionData){
    clearTempButtons();
    saveButton.hidden = true;
    loadButton.hidden = true;

    div = document.querySelector(".buttons");
    isIncognitoP = document.createElement("p");
    isIncognitoP.textContent = "В инкогнито: " + (sessionData.isIncognito ? "да" : "нет");
    isIncognitoP.className = "tempP";

    numTabsP = document.createElement("p");
    numTabsP.textContent = "Количество вкладок: " + sessionData.tabs.length;
    numTabsP.className = "tempP";

    dateP = document.createElement("p");
    date = new Date(sessionData.timestamp); 
    dateP.textContent = "Сохранено: " + date.toLocaleString("ru", {day: 'numeric', month: 'long', year: 'numeric'}) + " ";
    dateP.textContent += "в " + date.toLocaleString("ru", {hour: 'numeric', minute: 'numeric'});
    dateP.className = "tempP";

    openButton = document.createElement("button");
    openButton.className = "tempButton";
    openButton.append("Открыть");
    openButton.id = sessionData.name;
    openButton.addEventListener('click', event => {openTabs(event.target.id)});
   
    delButton = document.createElement("button");
    delButton.className = "tempButton";
    delButton.append("Удалить");
    delButton.addEventListener('click', event => {delSession(event.target.id)});
    delButton.id = sessionData.name;


    backButton = document.createElement("button");
    backButton.style = "margin-top: 1.5em;";
    backButton.className = "tempButton";
    backButton.append("Назад");
    backButton.addEventListener('click', requestAllData);
    backButton.addEventListener('click', clearTempButtons);
    backButton.addEventListener('click', clearTempP);
    
    div.append(isIncognitoP);
    div.append(numTabsP);
    div.append(dateP);
    div.append(openButton);
    div.append(delButton);
    div.append(backButton);
}

function requestAllData(){
    port.postMessage({get: "all"});
}

function toMain(){
    clearTempP();
    clearTempButtons();
    saveButton.hidden = false;
    loadButton.hidden = false;
}

function openTabs(groupName){
    port.postMessage({open: groupName});
    toMain()
}


function showData(data){
    div = document.querySelector(".buttons");
    saveButton.hidden = true;
    loadButton.hidden = true;

    data.forEach(tab => {
        button = document.createElement("button");
        button.id = tab.name;
        button.className = "tempButton";
        button.append(button.id);
        button.addEventListener('click', event => {getSessionData(event.target.id)});    
        div.append(button);        
    });

    backButton = document.createElement("button");
    backButton.style = "margin-top: 1.5em;";
    backButton.className = "tempButton";
    backButton.append("Назад");
    backButton.addEventListener('click', toMain);
    div.append(backButton);
}

port.onMessage.addListener(function(msg){    
    if (msg.allTabs != undefined){
        if (msg.allTabs == -1){
            alert("Нет сохраненных сессий");
        }else{
            showData(msg.allTabs);
        }
    }else if (msg.sessionInfo != undefined){
        showSessionData(msg.sessionInfo);
    }else if(msg.saveAlert != undefined){
        if(msg.saveAlert){
            alert("Сессия сохранена");
        }else{
            alert("Имя сессии должно быть уникальным");
        }
    }
});

saveButton.addEventListener('click', event => {
    name = prompt("Имя группы");
    if (name != "null" && name.length > 0){
        save(name);
    }
  });

loadButton.addEventListener('click', event => {
    requestAllData();
});

