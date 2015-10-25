var base = new Firebase("https://sensen.firebaseio.com/");

var FirebaseRef = new Firebase("https://sensen.firebaseio.com/");

var datasets = {}
var createdChart = false;
var myLineChart;
var desiredlength = 20;
var startTime;
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
    //console.log(d.logs)
    $.each(d.logs, function(key, val){
      $("#dataoption").append('<div class="item" data-value="'+ key +':' + val + '">' + key + '</div>');
      //console.log(key);
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
              fillColor: "rgba(220,220,220,0.2)",
              strokeColor: "rgba(220,220,220,1)",
              pointColor: "rgba(220,220,220,1)",
              pointStrokeColor: "#fff",
              pointHighlightFill: "#fff",
              pointHighlightStroke: "rgba(220,220,220,1)",
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
  var plotData = {
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

  for (var val in valsArray) {
    //Add to title list
    titles.push(val)
    //Attach a listener for the sensor: Update keys list and reload data when changed
    base.child("sensors").child(valsArray[val]).on("value", function(sensorSnapshot){
      timeList[sensorSnapshot.key()] = Object.keys(sensorSnapshot.val());
      dataList[sensorSnapshot.key()] = sensorSnapshot.val();
      var d = computeGraphableData();
      console.log("ss", sensorSnapshot.val());
      var unit = (Object.keys(sensorSnapshot.val()[Object.keys(sensorSnapshot.val())[0]])[0])
      plotData.datasets = [];
      plotData.labels = d.timeList;
      for (dataset in d.data) {
        plotData.datasets.push({
            label: dataset,
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            unit: unit,
            data: d.data[dataset]
        })
      }
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
    console.log(plotData);
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
      animation: false,
      multiTooltipTemplate: "<%%=datasetLabel%> : <%%= value %>"
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

getExp();
//createChart("testingChart")