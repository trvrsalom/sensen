var base = new Firebase("https://sensen.firebaseio.com/");

var FirebaseRef = new Firebase("https://sensen.firebaseio.com/");

var datasets = {}
var createdChart = false;
var myLineChart;
var desiredlength = 20;
var startTime;
var plotData = {
    labels: [],
    datasets: []
  };

var colorset = {};

function replaceBody(stra, strb) {
  document.body.innerHTML = document.body.innerHTML.replace(new RegExp(stra, "g"), strb);
}

function createChart(sensorName) {
  $(".ui.segment").append('<canvas class="chart-removable" id="' + sensorName + '" width="400" height="400"></canvas>')
}

function getExp() {
  var xpts = [];
  var ypts = {};
  var expid = window.location.hash.substr(1);
  FirebaseRef = new Firebase("https://sensen.firebaseio.com/experiments/" + expid);
  FirebaseRef.on("value", function(snapshot) {
    var d = snapshot.val();
    replaceBody("_expname", d.information.name);
    $.each(d.logs, function(key, val){
      $("#dataoption").append('<div class="item" data-value="'+ key +':' + val + '">' + key + '</div>');
      $('.ui.dropdown').dropdown({
        onChange: function(a){
          var firstPass = a.split(",");
          var secondPass = {};
          for (pair in firstPass) {
            var spair = firstPass[pair].split(":");
            secondPass[spair[0]] = spair[1];
          }
          genNTHGraph(secondPass);
        }
      });
      FirebaseRef = new Firebase("https://sensen.firebaseio.com/sensors/" + val);
      FirebaseRef.on("value", function(values) {
        values = values.exportVal()
        //genNTHGraph(values, key);
      });
    });
    //Testing
    genNTHGraph(d.logs);
  });
}
var lastColor = 0;
function randomColor(alpha) { 
    var pcolors = ["rgba(52, 152, 219,1.0)", "rgba(46, 204, 113,1.0)", "rgba(231, 76, 60,1.0)"];
    var toReturn = pcolors[lastColor];
    lastColor = lastColor == 2 ? 0 : lastColor + 1;
    console.log(toReturn);
    return toReturn;
}

var legend = {};

function genGraph(vals, name) {
  var xpts = [];
  $.each(vals, function(key, val) {
    xpts.push(key);
  });
  $.unique(xpts);
  var ypts = {};
  $.each(vals, function(key, val) {
    $.each(val, function(vkey, vval) {
      if(ypts[vkey] == undefined) {
        ypts[vkey] = [];
      }
      ypts[vkey].push(vval);
    });
  });
  var yvalarr = [];
  $.each(ypts, function(key, val) {
    yvalarr = [];
    $.each(val, function(kkey, vval) {
      yvalarr.push(vval);
    });
  });
  var data = {
    labels: xpts,
    datasets: [
          {
              label: name,
              fillColor: randomColor(0.2),
              strokeColor: randomColor(1),
              pointColor: randomColor(1),
              pointStrokeColor: "#fff",
              pointHighlightFill: "#fff",
              pointHighlightStroke: randomColor(1),              
	      data: yvalarr
          }
      ]
  };
  datasets[name] = data;
  (name);
}

function genNTHGraph(valsArray) {
  $(".chart-removable").remove();
  $("canvas").remove();
  var cid = new Date().getTime().toString();
  createChart(cid)
  //List of titles
  var titles = [];

  //Chart.js plotting data
  plotData = {
    labels: [],
    datasets: []
  };

  var timeList = {};
  var dataList = {}

  function computeGraphableData() {
    var timeListFinal = [];
    for (sensor in timeList) {
      for (time in timeList[sensor]) {
        var thisTime = parseInt(timeList[sensor][time]);
        if (timeListFinal.indexOf(thisTime) < 0) {
          timeListFinal.push(thisTime);
        }
      }
    }
    timeListFinal.sort()

    var dataArraysWithNull = {}
    for (sensor in dataList) {
	console.log(sensor);
      for (time in timeListFinal) {
        var thisDataEntry = dataList[sensor][timeListFinal[time]];

        //no data for time point is accounted for here
        if (dataArraysWithNull[sensor] === undefined) {
          dataArraysWithNull[sensor] = [];
        }
        //console.log(thisDataEntry);
        if (thisDataEntry !== undefined) {
          dataArraysWithNull[sensor].push(thisDataEntry[Object.keys(thisDataEntry)[0]]);
        } else {
          dataArraysWithNull[sensor].push(null);
        }
      }
    }
    return {timeList: timeListFinal, data: dataArraysWithNull};
  }
  $("#legend").html("");
  for (var val in valsArray) {
    var titlecount = 0;
    //console.log("val", val);
    //Add to title lis
    legend[val] = legend[val] == undefined ? randomColor(1) : legen[val];
    titles.push(val)
    //Attach a listener for the sensor: Update keys list and reload data when changed
    base.child("sensors").child(valsArray[val]).on("value", function(sensorSnapshot){
      var color = legend[val];
      timeList[sensorSnapshot.key()] = Object.keys(sensorSnapshot.val());
      dataList[sensorSnapshot.key()] = sensorSnapshot.val();
      var d = computeGraphableData();
      var unit = (Object.keys(sensorSnapshot.val()[Object.keys(sensorSnapshot.val())[0]])[0])
      plotData.datasets = [];
      plotData.labels = d.timeList;
      for (dataset in d.data) {
	titlecount--;
	console.log("pls work", titles[titlecount]);
        colorset[titlecount-0] = colorset[titlecount] == undefined ? randomColor(1) : colorset[titlecount];
	$("#legend").append("<div style='display: inline-block;border-radius:1000px;background-color:" + colorset[titlecount] + ";min-height: 10px;min-width:10px'></div> " + titles[titlecount] + "<br />");
	plotData.datasets.push({
            label: dataset,
            fillColor: "rgba(46, 204, 113,0.0)",
            strokeColor: colorset[titlecount],
            pointColor: color[titlecount],
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: color[titlecount],
            unit: unit,
            data: d.data[dataset]
        });
	titlecount++;
      }
      //console.log(plotData);
      showgraph();

    })
  }
  function showgraph(){
    var id = cid;
    //console.log(cid)
    var width = $("h1").width();
    $("[id='" + id + "']").attr("width", width);
    $("canvas").hide();
    $("canvas[id='" + id + "']").show();
    var ctx = $("[id='" + id + "']").get(0).getContext("2d");
    //console.log(plotData);
    while(Object.keys(plotData.labels).length > desiredlength) {
      plotData.labels.shift();
      $.each(plotData.datasets, function(key, obj) {
        obj.data.shift();
      });
    }
    startTime = startTime == undefined ? plotData.labels[0] : startTime;
    $.each(plotData.labels, function(key, obj) {
      plotData.labels[key] = ((obj - startTime)/1000).toFixed(2) + "s";
    });
    myLineChart = new Chart(ctx).Line(plotData, {
      responsive: true,
      animation: false
    });
    createdChart = true;
  }
}

function dispGraph(id) {
  var width = $("h1").width();
  $("[id='" + id + "']").attr("width", width);
  $("canvas").hide();
  $("canvas[id='" + id + "']").show();
  var data = datasets[id];
  //console.log(data);
  var ctx = $("[id='" + id + "']").get(0).getContext("2d");
  var myLineChart = new Chart(ctx).Line(data);
}

function ddosFirebase(ddoscount) {
  if(ddoscount < 10) {
    var target = FirebaseRef;
    var data = {}
    data[ddoscount*1000] = {
      "cm" : 25
    }
    target.set(data, function() {
      //console.log(ddoscount*1000);
      ddosFirebase(ddoscount + 1);
    });
  }
}

function exportData() {
   //console.log(plotData);
}

getExp();
//createChart("testingChart")
