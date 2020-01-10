/** @OnlyCurrentDoc */

function onInstall() {
  onOpen();
};

function onOpen() {
 var ui = SpreadsheetApp.getUi();
  ui.createMenu('SingularityNET')
    .addItem('TimeSeriesForecast', 'showSidebar')
    .addItem('ExampleService', 'example')
    .addToUi(); 
};

function showSidebar() {
  var html = HtmlService.createTemplateFromFile("sidebar")
    .evaluate()
    .setTitle("SingularityNET - TimeSeriesForecast");
  SpreadsheetApp.getUi().showSidebar(html);
};

function WriteColumns(data, words){
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var resultsheet = spreadsheet.getSheetByName("Result");
  if (resultsheet != null) {
        spreadsheet.deleteSheet(resultsheet);
    }

  resultsheet = spreadsheet.insertSheet();
  resultsheet.setName("Result");
  resultsheet.getRange(1, 1).setValue("Close");
  resultsheet.getRange(1, 2).setValue("SAX Word");
  
  for(i=0; i<data.length; i++){
    resultsheet.getRange(i+2, 1).setValue(data[i]);
    if(i < words.length) {
      resultsheet.getRange(i+2, 2).setValue(words[i]);
    }
  }
  
  return true;
};

function getSelection(){
  var spreadsheet = SpreadsheetApp.getActive();
  var activerange = spreadsheet.getActiveRange().getValues();
  if(activerange) {
    var data = activerange.join().split(',').filter(Boolean);
    return data;
  } else {
    return [];
  }
};

// =======================================================================================
// Testing different methods:
function _post(data){
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };
  var response = UrlFetchApp.fetch('http://bh2.singularitynet.io:7079/post', options);
  var result = JSON.parse(response.getContentText());
  return result;
};

function doGet(e) { return ContentService.createTextOutput("Testing...") };

function doPost(e) { return ContentService.createTextOutput("Testing...") };

function example(){
  var spreadsheet = SpreadsheetApp.getActive();
  var n = spreadsheet.getActiveCell().getValue();
  spreadsheet.getActiveCell().setValue(n * n);
};
// =======================================================================================
