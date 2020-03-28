// Copyright (c) 2012,2013 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Copyright (c) 2015 Jean-Martin Archer
// Use of this source code is governed by the MIT License found in LICENSE

function captureScreen (sendResponse) {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.setZoom(tab.id, 1.0);
        chrome.tabs.get(tab.id, function (tab) {
            chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 100 }, function (dataURI) {
                if (dataURI) {
                    sendResponse(dataURI);
                }
            });
        });
    });
};

function createEvidence (event) {
    let evidence = {
        url: '',
        local_storage: {},
        system_info: {},
        log_data: [],
        screenshot_encoded: ''
    }

    // url, local_storage and system_info
    let p1 = chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        evidence.url = tabs[0].url;
        // listener in content.js
        chrome.tabs.sendMessage(tabs[0].id, {action: "getBrowserData"}, function(response) {
            evidence.local_storage = response.local_storage;
            evidence.system_info = response.browser_data;
            return true;
        });
    });
    
    // log_data
    let p2 = chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // listener in background.js
        chrome.extension.sendMessage({tabId:tabs[0].id, action: "getConsoleLog"}, function (response) {
            console.log('getConsoleLog response', response);
            evidence.log_data = response;
            return true;
        });
    });

    // screenshot
    let p3 = captureScreen(function (response) {
        console.log('captureScreen response', response);
        evidence.screenshot_encoded = response;
        return true;
    });

    Promise.all([p1, p2, p3]).then(values => {
        console.log('All promises resolved!', evidence);
        // upload_to_s3(evidence);
    });
}


function downloadAndLoadEvidence (event) {
    // evidence = download_from_s3(url);
    // load_evidence(evidence);
}


(function () {
    var createEvidenceAction = document.getElementById('createEvidence');
    createEvidenceAction.onclick = createEvidence(event);

    var loadEvidenceAction = document.getElementById('loadEvidence');
    loadEvidenceAction.onclick = downloadAndLoadEvidence(event);
})();