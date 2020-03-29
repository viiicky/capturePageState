# fyle-inspector

A chrome extension debug tool (Fyle Detective) which helps capture useful details of any bug / issue in the Web app.

Features
1. **Collect Evidence to report an issue**
  Useful for anyone who encounters any issue on our app and want to report it.
  Evidences include -
  * Title (User given input)
  * Screenshot
  * URL
  * Logs from the console
  * System info
  * Local Storage data
  Uploads the evidence json and returns a 1day valid downloadable URL for this file.
  [fyle-detective](https://github.com/viiicky/fyle-detective) - a sister utility tool to analyse the evidence further with the URL and raise a ticket of the issue with the evidences collected.

2. **Load Evidence to debug an issue**
  Useful for a developer to start debug the reported issue.
  Helps to load the local storage and set the browser state to attempt a repro of the issue.
  Works on upload of the evidence.json file.


## Preview
![Tool Screenshot](/tool_screenshot.png)

## Usage Instructions
This Chrome Extension is not published to the Chrome Web Store, you need to install it in developer mode. You can find those instructions [here](#development)

1. Click on Extension Icon
2. To report an issue - Fill in title and hit `Collect Evidence`
3. To debug an issue - Upload the evidence json file and hit `Load Evidence`

### Development
1. Clone this repository.
2. Open up Chrome and go to the `chrome://extensions/` page (Window → Extensions).
3. Enable developer mode (if it's not already).
4. Click on `Load unpacked extension`.
5. Select the folder for this extension.

### Specifications
* Getting Screenshot
  * Takes screenshot of active tab using **Chrome Tabs API**
* Getting Console Logs
  * `popup.js` ==>`background.js` then **Chrome Debugger API** is used to get console logs for the active tab
* Getting Browser Info and Local Storage
  * `popup.js` ==> `content.js`
* Load Evidence
  * `popup.js` ==> `load_content.js`

### Credits
* Forked from [Chrome Extension - Capture Page State](https://github.com/salhernandez/capturePageState)

### Useful Reference
* Chrome APIs - https://developer.chrome.com/apps/api_index
