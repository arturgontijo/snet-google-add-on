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

function selectRange(A1Notation) {
  try {
    var ss = SpreadsheetApp.getActive();
    var sh = ss.getActiveSheet();
    sh.setActiveRange(ss.getRange(A1Notation))
  } catch (e) {
    return;
  }
}

function getSelRange() {
  var ss = preadsheetApp.getActive();
  var sh = ss.getActiveSheet();
  var rg = sh.getActiveRange();
  return rg.getA1Notation();
}

function showSidebar() {
  var html = HtmlService.createTemplateFromFile("sidebar")
    .evaluate()
    .setTitle("SingularityNET - TimeSeriesForecast");
  SpreadsheetApp.getUi().showSidebar(html);
};

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
  resultsheet = spreadsheet.insertSheet();
  resultsheet.setName("Result");
  resultsheet.appendRow([ "Date", "Series", "Trend", "Seasonal", "Forecast", "Lower", "Upper"])
  
  var chartssheet = spreadsheet.getSheetByName("Chart");
  if (chartssheet != null) {
    spreadsheet.deleteSheet(chartssheet);
  }
  chartssheet = spreadsheet.insertSheet();
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

function getSelection(A1Notation){
  var spreadsheet = SpreadsheetApp.getActive();

  if(A1Notation){
    try {
      spreadsheet.setActiveRange(spreadsheet.getRange(A1Notation));
    } catch (e) {
      return {data: undefined, A1Notation: ""};
    }
  }

  var selection = spreadsheet.getSelection();
  var data = [[], []];
  var values = [];
  var ranges = selection.getActiveRangeList().getRanges();
  if(ranges.length === 1 && ranges[0].getNumColumns() === 2){
    values = ranges[0].getValues();
    // Removing Headers
    if(values[0][0] === "ds" || values[0][0] === "Date" || values[0][0] === "date" ||
       values[0][1] === "y" || values[0][1] === "Series" || values[0][1] === "series") values.shift();
    for (var i = 0; i < values.length; i++) {
      if(values[i][0] === "" || values[i][1] === "") continue;
      try {
        data[0].push(Utilities.formatDate(new Date(values[i][0]), "GMT", "yyyy-MM-dd"));
        data[1].push(values[i][1]);
      } catch (e) { continue; }
    }
    if(data[0].length > 0 && data[1].length > 0 && data[0].length === data[1].length){
      return {data: data, A1Notation: ranges[0].getA1Notation()};
    }
  }
  if(ranges.length == 2){
    if (ranges[0].getNumColumns() == 1 && ranges[1].getNumColumns() == 1){
      data = [];
      for (var i = 0; i < ranges.length; i++) {
        values = ranges[i].getValues();
        data.push(values.join().split(',').filter(Boolean));
      }
      // Removing Headers
      if(data[0][0] === "ds" || data[0][0] === "Date" || data[0][0] === "date") data[0].shift();
      if(data[1][0] === "y" || data[1][0] === "Series" || data[1][0] === "series") data[1].shift();
      var ret_data = [[], []];
      for (var i = 0; i < data[0].length; i++) {
        try {
          ret_data[0].push(Utilities.formatDate(new Date(data[0][i]), "GMT", "yyyy-MM-dd"));
          ret_data[1].push(data[1][i]);
        } catch (e) { continue; }
      }
      if(ret_data.length == 2 && ret_data[0].length > 0 && ret_data[1].length > 0) {
        return {data: ret_data, A1Notation: ranges[0].getA1Notation() + ";" + ranges[1].getA1Notation()};
      }
    }
  }
  return {data: undefined, A1Notation: ""};
};
