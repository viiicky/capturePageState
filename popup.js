// Copyright (c) 2012,2013 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Copyright (c) 2015 Jean-Martin Archer
// Use of this source code is governed by the MIT License found in LICENSE

var bucketName = 'fyle-hackathon';
var bucketRegion = 'ap-south-1';
var IdentityPoolId = 'ap-south-1:cedc3d2e-5667-42df-a43b-c9569f6bc687';
var finalSignedURL = '';

// for upload json to s3 and download from signed url 
AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: bucketName }
});

function upload_to_s3 (evidence) {

  var json_str = JSON.stringify(evidence);
  var blob = new Blob([json_str], {
    type: 'application/json'
  });
  var fileName = 'evidence' + (new Date()).getTime() + '.json';

  var evidenceLocker = encodeURIComponent('evidence_locker') + '/';

  var evidenceFileKey = evidenceLocker + fileName;

  // Use S3 ManagedUpload class as it supports multipart uploads
  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: bucketName,
      Key: evidenceFileKey,
      Body: blob,
    }
  });

  var promise = upload.promise();

  return promise.then(
    function(data) {
          var params = {
            Bucket: bucketName,
            Key: evidenceFileKey,
            Expires: 86400
          };
          var url = s3.getSignedUrl('getObject', params);
          console.log('The URL is', url);
          return url;
        },
        function(err) {
          return alert('There was an error uploading your evidence. <br/> please try after sometime', err.message);
        }
    );
}

function download_from_s3 (signed_url) {
  return fetch(signed_url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(function(response) {
      return response.blob();
    })
    .then(function(blob) {
      b = new Blob([blob]);
      return b.text();
    })
    .then( function (b){
      console.log(b);
      return JSON.parse(b);
    })
    .catch(function(err) {
    console.log('error');
  });
}

// for screenshot
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
    // disable button
    document.getElementById('createEvidenceAction').className = 'cta-button disabled';

    let evidence = {
        title: document.getElementById('title').value,
        url: '',
        local_storage: {},
        system_info: {},
        log_data: [],
        screenshot_encoded: ''
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        evidence.url = tabs[0].url;
        // listener in content.js (gets url, local_storage and system_info)
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getBrowserData'}, function(response) {
            evidence.local_storage = response.local_storage;
            evidence.system_info = response.browser_data;

            // listener in background.js (gets log_data)
            chrome.extension.sendMessage({tabId:tabs[0].id, action: 'getConsoleLog'}, function (response) {
                console.log('getConsoleLog response', response);
                evidence.log_data = response;

                // gets screenshot_encoded
                captureScreen(function (response) {
                    console.log('captureScreen response', response);
                    evidence.screenshot_encoded = response;

                    upload_to_s3(evidence).then(function (signed_url) {
                        finalSignedURL = signed_url;
                        // clear form
                        document.getElementById('title').value = '';
                        var createEvidenceAction = document.getElementById('createEvidenceAction');
                        createEvidenceAction.value = 'Collect Evidence';

                        // show copySignedURL and success message
                        document.getElementById('successCollect').style.display = 'block';
                        var copySignedURL = document.getElementById('copySignedURL');
                        copySignedURL.style.display = 'block';
                        return download_from_s3(signed_url);
                    });
                });
            });
        });
    });
}

function loadEvidence (evidence) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log('loadEvidence', evidence)
        chrome.tabs.sendMessage(tabs[0].id, {action: 'LoadData', evidence: evidence}, function(response) {
            console.log(response);
            setTimeout(function() {
                if (response.response === 'Logged in') {
                    document.getElementById('successLoad').style.display = 'block';
                }
                // clear form
                document.getElementById('file').value = null;
                var loadEvidenceAction = document.getElementById('loadEvidenceAction');
                loadEvidenceAction.value = 'Load Evidence';
            }, 2000);
        });
    });
}

function loadEvidenceFromFile (event) {
    // disable button
    document.getElementById('loadEvidenceAction').className = 'cta-button disabled';
    var file = document.getElementById("file").files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        console.log(JSON.parse(e.target.result));
        evidence = e.target.result;
        loadEvidence(evidence);
    }
    reader.readAsText(file);
}

(function () {
    // report issue
    var createEvidenceAction = document.getElementById('createEvidenceAction');
    createEvidenceAction.disabled = true;
    createEvidenceAction.className = 'cta-button disabled';
    createEvidenceAction.addEventListener('click', createEvidence);

    // mandatory title
    var title = document.getElementById('title');
    title.addEventListener('keyup', function() {
      document.getElementById('successCollect').style.display = 'none';
      createEvidenceAction.disabled = !this.value;
      var className = !this.value ? 'cta-button disabled' : 'cta-button cursor-pointer';
      createEvidenceAction.className = className;
    });

    // debug issue
    var loadEvidenceAction = document.getElementById('loadEvidenceAction');
    loadEvidenceAction.disabled = true;
    loadEvidenceAction.className = 'cta-button disabled';
    loadEvidenceAction.addEventListener('click', loadEvidenceFromFile);

    // mandatory file
    var file = document.getElementById('file');
    file.addEventListener('change', function () {
        document.getElementById('successLoad').style.display = 'none';
        loadEvidenceAction.disabled = !this.value;
        var className = !this.value ? 'cta-button disabled' : 'cta-button cursor-pointer';
        loadEvidenceAction.className = className;
    });

    // show copySignedURL
    var copySignedURL = document.getElementById('copySignedURL');
    copySignedURL.addEventListener('click', function () {
        console.log('finalSignedURL', finalSignedURL);
        navigator.clipboard.writeText(finalSignedURL).then(function () {
            var copySignedURL = document.getElementById('copySignedURL');
            copySignedURL.innerHTML = 'Copied Evidence URL to the clipboard!';
            copySignedURL.className = 'message done';
        });
    });

})();
