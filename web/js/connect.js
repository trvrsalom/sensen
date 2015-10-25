var FirebaseRef = new Firebase("https://sensen.firebaseio.com/");

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function clearTable() {
  $("#experimentstable").html("");
}

function experiment(experimentid) {
  console.log(experimentid);
  window.location.href = "../experiment.html#" + experimentid
}

function listExperiments() {
  FirebaseRef.child("experiments").on("value", function(data) {
    clearTable();
    data.forEach(function(childSnapshot) {
      var key = childSnapshot.key();
      var childData = childSnapshot.val();
      console.log(childData);
      $($("#experimentstable")[0]).append("<tr onclick=\"experiment('" + key + "')\"><td>" + childData.information.name + "</td><td>" + key + "</td><td>" + childData.information.created_by + "</td></tr>");
    });
  });
}

function createExperiment() {
  var targetref = FirebaseRef.child("experiments/"+s4());
  var data = {
    "information" : {
      "created_by" : $("#username").val(),
      "name" : $("#exprname").val()
    }
  };
  targetref.set(data);
}

listExperiments();
