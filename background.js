function getStorageDataPromise(){
    return new Promise(function(resolve, reject){
        chrome.storage.local.get(['tabs_list'], data => {
            if (data.tabs_list != undefined)
                resolve(data['tabs_list']);
            else{
                reject();
            }
        });
    });
}

function updateStorage(addData, port){    
    getStorageDataPromise().then(function(data){
        isOnBase = data.find(tab => tab.name == addData.name);
        if (!isOnBase){
            data.push(addData);
            setToStorage(data);
            port.postMessage({saveAlert: true});
        }else{
            port.postMessage({saveAlert: false});
        }
    }).catch(function (){
        setToStorage([addData]);
        port.postMessage({saveAlert: true});
    });
}

function setToStorage(x){
    chrome.storage.local.set({'tabs_list': x}, function() {});
}

async function openNewWindow(firstTab, isIncognito){
    chrome.windows.create({incognito: isIncognito, url: firstTab}, window=>{
        return window.id;
    });
}

function getSessionData(sessionName, port){
    getStorageDataPromise().then(function(data){
        session =  data.find(session => session.name === sessionName);
        port.postMessage({sessionInfo: session});
    });
}

function openTabsList(tabs, isIncognito){
    openNewWindow(tabs[0].url, isIncognito).then(windowId=>{
        tabs.slice(1).forEach(tab=>{
            chrome.tabs.create({windowId: windowId, url: tab.url})
        });
        return windowId;
    });
}

function openTabs(sessionName){
    getStorageDataPromise().then(function(data){
        data.forEach(session => {
            if (session.name === sessionName){
                openTabsList(session.tabs, session.isIncognito);
            }            
        });
    });
}

function save(saveName, port){
    var p = new Promise(function(resolve){
        chrome.tabs.query({lastFocusedWindow: true }, function(currentTabs){
            resolve(currentTabs);
        });
    });
    
    p.then(function(currentTabs){
        session = {};
        tabsList = [];
        isIncognito = false;
        timestamp = (new Date()).valueOf();

        currentTabs.forEach(tab => {
            tabsList.push({"title": tab.title, "url": tab.url});
            isIncognito = tab.incognito;       
        });

        session["name"] = saveName;
        session["isIncognito"] = isIncognito;
        session["tabs"] = tabsList;
        session["timestamp"] = timestamp;
        if (session["tabs"].length > 0){
            updateStorage(session, port);
        }
    });
}

function delSession(sessionName){
    p = new Promise(function(r, _){
        getStorageDataPromise().then(function(data){
            tempData = []
            data.forEach(tab => {
                if (sessionName != tab.name){
                    tempData.push(tab);
                }
            });
            r(tempData);
        });
    });
    p.then(tempData => {setToStorage(tempData)});
}

function sendAllFromStorage(port){
    var p = new Promise(function(resolve, _){
        chrome.storage.local.get(['tabs_list'], data => {
            resolve(data['tabs_list']);
        });
    });

    p.then(function(data){
        if (data != undefined){
            port.postMessage({allTabs: data});
        }else{
            port.postMessage({allTabs: -1});
        }
        void chrome.runtime.lastError;
    });
}

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        if (msg.save != undefined){
            save(msg.save, port);
        }else if(msg.get != undefined){
            sendAllFromStorage(port);
        }else if(msg.open != undefined){
            openTabs(msg.open);
        }else if(msg.getSession != undefined){
            getSessionData(msg.getSession, port);
        }else if(msg.delSession != undefined){
            delSession(msg.delSession);
        }
    });
});

