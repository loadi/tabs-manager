const port = chrome.runtime.connect();
const saveButton = document.getElementById("toSaveMenu");
const saveButtonPopup = document.getElementById("save");
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
    Object.values(document.getElementsByClassName("tempDiv")).forEach(button => {
        button.remove();
    });
}

function getSessionData(sessionName){
    port.postMessage({getSession: sessionName});
}

function delSessionReq(sessionName){
  port.postMessage({delSession: sessionName});
  clearTempButtons();
  clearTempP();
}

function delSession(sessionName){
    clearTempP();
    clearTempButtons();
    div = document.querySelector(".buttons");
    buttonsDiv = document.createElement("div");
    buttonsDiv.className = "tempP";

    span = document.createElement("span");
    span.textContent = "Удалить группу \"" + sessionName + "\"?";
    span.className = "tempP";

    yesButton = document.createElement("button");
    yesButton.className = "tempButton halfButton";
    yesButton.append("Да");
    yesButton.addEventListener("click", e =>{
      delSessionReq(sessionName);
      showPopupSave("Группа удалена");
      toMain();
    });

    noButton = document.createElement("button");
    noButton.className = "tempButton halfButton";
    noButton.append("Нет");
    noButton.addEventListener("click", e =>{
      clearTempP();
      clearTempButtons();
      requestAllData();
    });

    buttonsDiv.append(yesButton);
    buttonsDiv.append(noButton);
    div.append(span);
    div.append(buttonsDiv);
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
    openButton.className = "tempButton bigButton";
    openButton.append("Открыть");
    //openButton.id = sessionData.name;
    openButton.addEventListener('click', () => {openTabs(sessionData.name)});

    delButton = document.createElement("button");
    delButton.className = "tempButton bigButton";
    delButton.append("Удалить");
    //delButton.id = sessionData.name;
    delButton.addEventListener('click', () => {delSession(sessionData.name)});

    backButton = document.createElement("button");
    backButton.style = "margin-top: 1.5em;";
    backButton.className = "tempButton bigButton";
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
    toMain();
}


function showData(data){
    div = document.querySelector(".buttons");
    saveButton.hidden = true;
    loadButton.hidden = true;

    data.forEach(tab => {
        buttonDiv = document.createElement("div");
        buttonDiv.className = "tempDiv";

        button = document.createElement("button");
        //button.id = tab.name;
        button.className = "tempButton";
        button.append(tab.name);
        button.addEventListener('click', () => {openTabs(tab.name)});
        buttonDiv.append(button);

        button = document.createElement("button");
        //button.id = tab.name;
        button.className = "tempButton smallButton";
        button.append("i");
        button.addEventListener('click', () => {getSessionData(tab.name)});
        buttonDiv.append(button);

        button = document.createElement("button");
        //button.id = tab.name;
        button.className = "tempButton smallButton";
        button.append("x");
        button.addEventListener('click', () => {delSession(tab.name)});
        buttonDiv.append(button);
        div.append(buttonDiv);
    });

    backButton = document.createElement("button");
    backButton.style = "margin-top: 1.5em; width: 95% !important;";
    backButton.className = "tempButton";
    backButton.append("Назад");
    backButton.addEventListener('click', toMain);
    div.append(backButton);
}

function showPopupSave(msg){
  document.getElementById("popupMsgSpan").textContent = msg;
  window.location = "#savePopupMsg";
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
            showPopupSave("Группа сохранена");
        }else{
            showPopupSave("Имя группы должно быть уникальным");
        }
    }
});

saveButton.addEventListener('click', () =>{
  document.getElementById("sessionName").value = "";
});

saveButtonPopup.addEventListener('click', () => {
    name = document.getElementById("sessionName").value;
    if (name.length > 0){
        save(name);
        document.getElementById("sessionName").value = "";
    }else{
      showPopupSave("Имя группы не может быть пустым");
    }
  });

loadButton.addEventListener('click', () => {
    requestAllData();
});
