require('sproutcore');

Chat = SC.Application.create({
  main: function() {
    Chat.store = SC.Store.create().from('Chat.DataSource');
    Chat.statechart.initStatechart();
  }
});

Util = {};

/*
 * Binds context of a function to an object. The original context is
 * preserved and passed as the first argument to the function.
 */
Util.bind = function(obj, fn) {
  return function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(this);
    if (typeof fn == 'string') fn = obj[fn];
    return fn.apply(obj, args); 
  }
};

