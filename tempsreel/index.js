function tempsreel(io, tickDelay){
console.log("temps reel");
this.io = io;
this.tickDelay = tickDelay || 1000;
this.snapshot = {
  actions: []
};

this.tickInterval = this.interval();

}

tempsreel.prototype.interval = function(){
  var tr = this;
  var tickInterval = setInterval(function() {
  //A intervalles réguliers, on envoie à tout utilisateur connecté, un snapshot des dernières modifications et on réinitialise les actions stockées dans le snapshot
    console.log("tick");
    tr.io.emit('tick', tr.snapshot);
  //  console.log(snapshot);
  /*if(snapshot.actions.length >0){
    updateSnapshot();
    console.log("tock");
    io.emit('tick', snapshot);
    snapshot.actions = new Array();
  }*/
}, this.tickDelay);

return tickInterval;
}


module.exports = tempsreel;
