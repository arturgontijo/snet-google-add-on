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
  var html = HtmlService.createTemplateFromFile("sidebar")
    .evaluate()
    .setTitle("SingularityNET - TimeSeriesForecast");
  SpreadsheetApp.getUi().showSidebar(html);
};

function WriteColumns(series, response){
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var resultsheet = spreadsheet.getSheetByName("Result");
  if (resultsheet != null) {
    spreadsheet.deleteSheet(resultsheet);
  }
  resultsheet = spreadsheet.insertSheet();
  resultsheet.setName("Result");
  resultsheet.appendRow([ "Date", "Series", "Trend", "Seasonal", "Forecast", "Lower", "Upper"])
  
  var chartssheet = spreadsheet.getSheetByName("Charts");
  if (chartssheet != null) {
    spreadsheet.deleteSheet(chartssheet);
  }
  chartssheet = spreadsheet.insertSheet();
  chartssheet.setName("Charts");

  // STL
  var trend = response.trend;
  var seasonal = response.seasonal;
  // Prophet
  var forecast_ds = response.forecast_ds;
  var forecast = response.forecast;
  var forecast_lower = response.forecast_lower;
  var forecast_upper = response.forecast_upper;
  
  var r = [];
  for(var i=0; i < series.length; i++){
    r.push([forecast_ds[i],
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
    r.push([forecast_ds[i],
            "",
            "",
            "",
            forecast[i],
            forecast_lower[i],
            forecast_upper[i]
           ])
  }
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

function getSelection(){
  var spreadsheet = SpreadsheetApp.getActive();
  var selection = spreadsheet.getSelection();
  var data = [];
  var values = [];
  var ranges =  selection.getActiveRangeList().getRanges();
  if(ranges.length == 2){
    for (var i = 0; i < ranges.length; i++) {
      values = ranges[i].getValues();
      // Removing header
      values.shift();
      data.push(values.join().split(',').filter(Boolean));
    }
    for (var i = 0; i < data[0].length; i++) {
      data[0][i] = Utilities.formatDate(new Date(data[0][i]), "GMT", "yyyy-MM-dd")
    }
    if(data.length == 2 && data[0].length > 0 && data[1].length > 0) {
      return data;
    }
  }
  return;
};
