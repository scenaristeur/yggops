function boose(mode, base, graph){
  this.modeName = mode || "sublevel";
  this.baseName = base || "smagBoose";
  this.graphName = graph || "graph0";
  this.initBoose(this.modeName);
}

boose.prototype.initBoose = function(modeName){
  console.log("boose "+modeName);
  switch (modeName) {
    case "sublevel":
    console.log("mode sublevel");
    this.createBase(this.baseName);
    case "fuseki":
    console.log("mode non pris en charge");
    break;
    case "none" :
    console.log("mode non pris en charge");
    break;
    default:
    console.log("mode non pris en charge");
  }
}

boose.prototype.createBase = function(baseName){
  console.log("boose "+baseName);
  //https://github.com/levelgraph/levelgraph
  var level = require("level");
  var sublevel = require("level-sublevel");
  var sublevel = require("level-sublevel");
  this.db = sublevel(level("data/"+this.baseName));
  this.createGraph(this.db, this.graphName);
}

boose.prototype.createGraph = function(db, graphName){
  console.log("boose "+graphName);
  var levelgraph = require("levelgraph");
  this.graph = levelgraph(db.sublevel(graphName));
}

boose.prototype.switchBase = function(newBase){
  console.log("switch Base NON implemente "+newBase);
}

boose.prototype.switchGraph = function(newGraph){
  console.log("swtich Graph NON implemente "+newGraph);
}



module.exports = boose;
