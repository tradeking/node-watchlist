var conntected = false;

socket = io.connect("http://" + window.location.hostname + ":3000");

socket.on('connect',function() {
  connected = true;
  socket.emit('test',{foo:'bar'});
  // call init function if it exists
  if(typeof init == 'function') { init(); }
});
socket.on('disconnect', function () {
  console.log("lost it");
});