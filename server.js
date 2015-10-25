var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var firebase = require('firebase');
var uuid = require("node-uuid");
var base = new firebase("https://sensen.firebaseio.com");


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function(req, res){
	res.status(404).json({status: "Error", message: "No Page Present"});
})

app.get("/api", function(req, res){
	res.status(500).json({status: "Error", message: "Undefined route"});
})

app.get("/api/test", function(req, res){
	base.once("value", function(data){
		res.json(data.val());
	})
})

app.post("/api/uniqueID", function(req, res) {
	res.json({"uid": uuid.v4(), status: "Success"})
})

app.post("/api/updateSensor", function(req, res) {
	res.json({"uid": req.body.uid, "data": req.body.data, status: "Success"})
	var data = []
	base.child("sensors").child(req.body.uid).child(new Date().getTime().toString()).child(req.body.data.unit).set(req.body.data.dataparams)
})

app.use(express.static('web'));

var server = app.listen(5000, function () {
  var host = server.address().address;
  var port = server.address().port;
});
