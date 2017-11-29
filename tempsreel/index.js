function tempsreel(io, base, tickDelay){
  console.log("temps reel");
  this.io = io;
  this.base = base;
  this.tickDelay = tickDelay || 1000;
  this.snapshot = {
    actions: []
  };
//  this.socketbox();
  this.tickInterval = this.interval();

}

tempsreel.prototype.interval = function(){
  var tr = this;
  var tickInterval = setInterval(function() {
    //A intervalles réguliers, on envoie à tout utilisateur connecté, un snapshot des dernières modifications et on réinitialise les actions stockées dans le snapshot
    console.log("tick");
    tr.io.emit('tick', tr.snapshot);
    //  console.log(snapshot);
    if(tr.snapshot.actions.length >0){
    tr.updateSnapshot();
    console.log("tock");
    tr.io.emit('tick', tr.snapshot);
    tr.snapshot.actions = new Array();
  }
}, this.tickDelay);

return tickInterval;
}

tempsreel.prototype.updateSnapshot = function () {
  //console.log("update");
  //tr.snapshot.numUsers = numUsers;
  console.log(this.snapshot);
  var d = new Date();
  var n = d.getSeconds();
  this.snapshot.tick = n;
}


module.exports = tempsreel;
