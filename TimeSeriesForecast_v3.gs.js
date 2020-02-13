/** @OnlyCurrentDoc */

function onInstall() {
  onOpen();
};

function onOpen() {
 var ui = SpreadsheetApp.getUi();
  ui.createMenu('SingularityNET')
    .addItem('TimeSeriesForecast', 'showSidebar')
    .addToUi(); 
};

function showSidebar() {
  var html = HtmlService.createTemplateFromFile("Sidebar")
    .evaluate()
    .setTitle("SingularityNET - TimeSeriesForecast");
  SpreadsheetApp.getUi().showSidebar(html);
};

function getAndSetRanges(dates_A1, series_A1) {
  var spreadsheet = SpreadsheetApp.getActive();
  var sheet = spreadsheet.getActiveSheet();
  var dates_range = "";
  var series_range = "";
  var dates_sheet = sheet;
  var series_sheet = sheet;
  try {
    if(dates_A1.indexOf("!") > -1) {
      dates_sheet = dates_A1.split("!")[0];
      if(dates_sheet.indexOf("'") == 0) dates_sheet = dates_sheet.replace(/'/g, "");
      if(dates_sheet.indexOf('"') == 0) dates_sheet = dates_sheet.replace(/"/g, "");
      dates_sheet = spreadsheet.getSheetByName(dates_sheet);
    }
    if(series_A1.indexOf("!") > -1) {
      series_sheet = series_A1.split("!")[0];
      if(series_sheet.indexOf("'") == 0) series_sheet = series_sheet.replace(/'/g, "");
      if(series_sheet.indexOf('"') == 0) series_sheet = series_sheet.replace(/"/g, "");
      series_sheet = spreadsheet.getSheetByName(series_sheet);
    }
    dates_range = dates_sheet.getRange(dates_A1);
    series_range = series_sheet.getRange(series_A1);
    
    var range_list = []
    if(dates_A1) range_list.push(dates_A1);
    if(series_A1) range_list.push(series_A1);
    var ranges = spreadsheet.getRangeList(range_list);
    spreadsheet.setActiveRangeList(ranges);
    return [dates_range, series_range]
  } catch (e) {
    var err = e;
    sheet.getRange("A1").activate();
    return [dates_range, series_range];
  }
}

function getSelectedRangeA1() {
  var spreadsheet = SpreadsheetApp.getActive();
  var selection = spreadsheet.getSelection();
  var ranges = selection.getActiveRangeList().getRanges();
  var A1_list = ["", ""];
  if(0 < ranges.length <= 2) {
    for (var i = 0; i < ranges.length; i++) {
      A1_list[i] = ranges[i].getA1Notation();
    }
  }
  return A1_list;
}

function WriteColumns(ds, series, response){
  // STL
  var trend = response.trend;
  var seasonal = response.seasonal;
  // Prophet
  var forecast = response.forecast;
  var forecast_lower = response.forecast_lower;
  var forecast_upper = response.forecast_upper;

  // Checking if any data was sent back
  if(forecast === undefined || forecast.length < series.length){
    return false;
  }
  
  var r = [];
  for(var i=0; i < series.length; i++){
    r.push([ds[i],
            series[i],
            trend[i],
            seasonal[i],
            forecast[i],
            forecast_lower[i],
            forecast_upper[i]
           ])
  }
  // Adding the Forecast Points
  for(var i=series.length; i < forecast.length; i++){
    r.push(["",
            "",
            "",
            "",
            forecast[i],
            forecast_lower[i],
            forecast_upper[i]
           ])
  }

  // Wrinting new SS, Result and Chart
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var resultsheet = spreadsheet.getSheetByName("Result");
  if (resultsheet != null) {
    spreadsheet.deleteSheet(resultsheet);
  }
  var last_sheet = spreadsheet.getSheets().length;
  resultsheet = spreadsheet.insertSheet(last_sheet);
  resultsheet.setName("Result");
  resultsheet.appendRow([ "Date", "Series", "Trend", "Seasonal", "Forecast", "Lower", "Upper"])
  
  var chartssheet = spreadsheet.getSheetByName("Chart");
  if (chartssheet != null) {
    spreadsheet.deleteSheet(chartssheet);
  }
  last_sheet = spreadsheet.getSheets().length;
  chartssheet = spreadsheet.insertSheet(last_sheet);
  chartssheet.setName("Chart");

  var range = resultsheet.getRange(2, 1, forecast.length, 7);
  range.setValues(r);

  var range_f_series = resultsheet.getRange("B1:B")
  var chart_f_series = resultsheet.newChart()
      .setChartType(Charts.ChartType.LINE)
      .addRange(range_f_series)
      .setOption('title', 'Series & Forecast')
      .setOption('width', 1000)
      .setOption('height', 420)
      .setPosition(2, 1, 0, 0)
      .build();
  var range_forecast = resultsheet.getRange("E1:E")
  chart_f_series = chart_f_series.modify()
      .addRange(range_forecast)
      .build();
  var range_f_lower = resultsheet.getRange("F1:F")
  chart_f_series = chart_f_series.modify()
      .addRange(range_f_lower)
      .build();
  var range_f_upper = resultsheet.getRange("G1:G")
  chart_f_series = chart_f_series.modify()
      .addRange(range_f_upper)
      .setOption('series',
                 {
                   0:{labelInLegend:"Series", color: '#000000'},
                   1:{labelInLegend:"Forecast", color: '#0000ff', opacity: 0},
                   2:{labelInLegend:"Lower", color: '#aff2fd', lineDashStyle: [4, 1], opacity: 0},
                   3:{labelInLegend:"Upper", color: '#aff2fd', lineDashStyle: [4, 1], opacity: 0}
                 }
                )
      .build();
  
  chartssheet.insertChart(chart_f_series);
  
  return true;
};

function getSelection(dates_A1, series_A1){
  // Ensuring that the Selection is the same from "Data range" input.
  var ranges = getAndSetRanges(dates_A1, series_A1);
  var data = [[], []];
  var dates_values = [];
  var series_values = [];
  // Dates Range
  dates_values = ranges[0].getValues();
  dates_values.shift();
  // Series Range
  series_values = ranges[1].getValues();
  series_values.shift();
  
  if(dates_values && dates_values.length == series_values.length){
    for (var i = 0; i < dates_values.length; i++) {
      // Removing empty cells
      if(dates_values[i][0] === "" || series_values[i][0] === "") continue;
      try {
        data[0].push(Utilities.formatDate(new Date(dates_values[i][0]), "GMT", "yyyy-MM-dd"));
        data[1].push(series_values[i][0]);
      } catch (e) { continue; }
    }
  }
  return data;
};
