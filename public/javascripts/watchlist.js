var quote_interval;
var symbol_list = [];
function init() {

  console.log('init called');

  // tell the server to start sending data
  socket.emit('watchlist-stream');
  socket.emit('index-poll');

  quote_interval = setInterval(function() {
    socket.emit('watchlist-stream');
    socket.emit('watchlist-poll');
  }, 5200);
  index_interval = setInterval(function() {
    socket.emit('index-poll');
  }, 6500);

  // handle array of symbols
  socket.on('watchlist-symbols',function(symbols) {
    for(var s in symbols.watchlists.watchlist.watchlistitem) {
      add_symbol_to_dom({
        symbol:symbols.watchlists.watchlist.watchlistitem[s].instrument.sym
      });
    }
  });

  socket.on('index-symbols',function(data) {
    //console.log('got new indices');
    update_indices(data);
    // console.log(symbols)
  });

  socket.on('trade-completed',function(data) {
    console.log('trade completed: ' + data);
    $('#facebox .content #loading').remove();
    $('#facebox .content').append('<h2>Completed!</h2><h3>Your order id is: ' + data + '</h3>')
  });

  socket.on('watchlist-quotes', function(data) {
    //console.log("Got new quotes");
    for(var quote in data) {
      update_symbol(data[quote])
    }
  });

  socket.on('tweet', function(tweet) {
    // console.log(tweet.text);
    //myregexp = new RegExp("\\$[a-zA-Z]*", "gims")
    //console.log(myregexp.exec(tweet.text))

    // All tweets into the alltweets container
    create_tweet('#alltweets', tweet);
    $('.tweets').jScrollPane();
    $('#tweetwrapper #handle').effect('highlight');

    // Symbol specific tweets
    myregexp = new RegExp("\\$([a-zA-Z]*)", "gim")
    var match;
    var symbol;
    //tweet.text += ' $AAPL ';
    while (match = myregexp.exec(tweet.text)) {
      symbol = match[1].toUpperCase();
      // console.log(symbol)
      var twitter_user_pic = '<img align="left" src="' + tweet.user.profile_image_url + '" />';
      var twitter_user_name = '<strong>' + tweet.user.screen_name + '</strong>';
      var twitter_date_time = '<span class="timeago" title="'+tweet.created_at+'">' + tweet.created_at + '</span>';
      var twitter_text = '<span class="twitter_text">' + tweet.text + '</span>';

      $('#container .quote[symbol="' + symbol + '"] .tweets .jspPane').prepend('<p class="tweet">' + twitter_user_pic + twitter_user_name + twitter_text + twitter_date_time + '</p><div style="clear: both;"></div>');
      $('#container .quote[symbol="' + symbol + '"] .tweet_number').html($('#container .quote[symbol="' + symbol + '"] .tweet').length);

      $('.quote[symbol="' + symbol + '"] .tweet:gt(9)').remove();

      $('.timeago').timeago();
      $('.tweets').jScrollPane();
      $('#container .quote[symbol="' + symbol + '"]').effect('highlight', null, 'slow');
      $('#container .quote[symbol="' + symbol + '"] .ui-icon-comment').effect('bounce', null, 'fast');
    }
    $('#alltweets .tweet:gt(29)').remove();
  });

  $(document).keydown(function(e) {
    if(e.keyCode==9) {
      $('#add-symbol').focus();
      return false;
    }
  })
  $('#add-symbol').keypress(function(e) {

    if(e.keyCode==13) {
      if($('.quote[symbol="' + $(this).val().toUpperCase() + '"]').length==0) {
        console.log('calling add symbol: ' + $(this).val())
        add_symbol_to_watchlist($(this).val().toUpperCase());
        add_symbol_to_dom({symbol:$(this).val().toUpperCase()});
      } else {
        console.log('already in watchlist')
      }
      $(this).val('').focus();
      return false;
    }
  });


  $('#tweetwrapper #handle').click(function() {
    if($('#tweetwrapper').hasClass('closed')) {
      $('#tweetwrapper').animate({right: 0 });
    } else {
      $('#tweetwrapper').animate({right: -360 });
    }
    $('#tweetwrapper').toggleClass('closed');
  })
}

function add_symbol_to_dom(quote) {
  if($('.quote[symbol="' + quote.symbol.toUpperCase() + '"]').length>0) return false;
  symbol_list.push('$' + quote.symbol.toUpperCase());
  var html = [
    '<div class="quote" symbol="' + quote.symbol.toUpperCase() + '">',
    ' <div class="details">',
    '   <a href="javascript:;" class="trade_link function ui-icon ui-icon-transferthick-e-w"></a>',
    '   <a href="javascript:;" class="show_tweets function ui-icon ui-icon-comment"></a>',
    '   <a href="javascript:;" class="delete_symbol function ui-icon ui-icon-closethick"></a>',
    '   <h3>' + quote.symbol + '</h3>',
    '   <h5></h5>',
    '   <table>',
    '    <tr class="p1">',
    '      <td>Last Price:</td>',
    '      <td class="right sep"></td>',
    '      <td>Change: </td>',
    '      <td class="right"></td>',
    '    </tr>',
    '    <tr class="p2">',
    '      <td>Bid: </td>',
    '      <td class="right sep"></td>',
    '      <td>Ask: </td>',
    '      <td class="right"></td>',
    '    </tr>',
    '    <tr>',
    '      <td colspan="4" style="border-bottom: 1px solid #CCCCCC;"></td>',
    '    </tr>',
    '    <tr class="p3">',
    '      <td>Open: </td>',
    '      <td class="right sep"></td>',
    '      <td>Prev Close: </td>',
    '      <td class="right"></td>',
    '    </tr>',
    '    <tr class="p3">',
    '      <td>Today High: </td>',
    '      <td class="right sep"></td>',
    '      <td>Today Low: </td>',
    '      <td class="right"></td>',
    '    </tr>',
    '    <tr class="p4">',
    '      <td>52 Week High: </td>',
    '      <td class="right sep"></td>',
    '      <td>52 Week Low: </td>',
    '      <td class="right"></td>',
    '    </tr>',
    '  </table>',
    ' </div>',
    ' <div class="form">',
    '   <a href="javascript:;" class="hide_tweets function ui-icon ui-icon-arrowreturnthick-1-w"></a>',
    '  <h3>' + quote.symbol + ' - <span class="tweet_number">0</span> tweet(s)</h3>',
    '  <div class="tweets"></div>',
    ' </div>',
    '</div>'
  ]

  var $elm = $(html.join(''));

  $('#container').prepend($elm);
  $('#container .quote[symbol="' + quote.symbol + '"]').css({
    width:0,
    marginLeft:0,
    marginRight:0
  }).fadeTo(0,0).fadeTo(500,1).animate({
    width:370,
    marginLeft:5,
    marginRight:5
  });

  $('#container .quote[symbol="' + quote.symbol + '"] .show_tweets').live('click',function() {
    show_tweets($(this).parents('.quote').attr('symbol'))
  });
  $('#container .quote[symbol="' + quote.symbol + '"] .hide_tweets').live('click',function() {
    hide_tweets($(this).parents('.quote').attr('symbol'))
  });
  $('#container .quote[symbol="' + quote.symbol + '"] .hide_tweets').live('click',function() {
    hide_tweets($(this).parents('.quote').attr('symbol'))
  });
  $('#container .quote[symbol="' + quote.symbol + '"] .delete_symbol').live('click',function() {
    remove_symbol_from_watchlist($(this).parents('.quote').attr('symbol'))
    remove_symbol_from_dom($(this).parents('.quote').attr('symbol'))
  });
  $('#container .quote[symbol="' + quote.symbol + '"] .tweets').jScrollPane();
}

function add_symbol_to_watchlist(symbol) {
  socket.emit('add-symbol', symbol.toUpperCase());
}

function show_tweets(symbol) {
  $('.quote[symbol="' + symbol + '"] .details').animate({top:-190});
  $('.quote[symbol="' + symbol + '"] .form').animate({top:0});
}

function hide_tweets(symbol) {
  $('.quote[symbol="' + symbol + '"] .details').animate({top:00});
  $('.quote[symbol="' + symbol + '"] .form').animate({top:190});
}

function remove_symbol_from_dom(symbol) {
    if($('.quote').length>2) {
        if(confirm('Delete ' + symbol + ' from watchlist?')) {
            $('.quote[symbol="' + symbol + '"]').fadeTo(500,.01,function() {
                $(this).animate({width:0},function() {
                    $(this).remove();
                })
            });
        }
    }
}

function remove_symbol_from_watchlist(symbol) {
  socket.emit('remove-symbol', symbol);
}

function update_symbol(quote) {
  var style = quote.pchg < 0 ? 'down' : 'up';

  $symbol = $('.quote[symbol="' + quote.symbol + '"]');
  if($symbol.length<=0) return false;
  $symbol[0].className = 'quote ' + (quote.pcchg < 0 ? 'down' : 'up');
  $symbol.find('h5').html(quote.name);
  $symbol.find('.p1 .right:first').html(quote.last).removeClass('up').removeClass('down').addClass(style);
  $symbol.find('.p1 .right:last').html(Math.round(quote.chg * 1000) / 1000 + ' (' + quote.pchg + '%)').removeClass('up').removeClass('down').addClass(style);
  $symbol.find('.p2 .right:first').html(quote.bid + 'x' + quote.bidsz);
  $symbol.find('.p2 .right:last').html(quote.ask + 'x' + quote.asksz);
  $symbol.find('.p3:first .right:first').html(quote.opn);
  $symbol.find('.p3:first .right:last').html(quote.cl);
  $symbol.find('.p3:last .right:first').html(quote.hi);
  $symbol.find('.p3:last .right:last').html(quote.lo);
  $symbol.find('.p4 .right:first').html(quote.wk52hi);
  $symbol.find('.p4 .right:last').html(quote.wk52lo);
}

function update_indices(data) {
  for(var quote in data) {
    symbol = data[quote].symbol;
    $('#' + symbol + ' span.value').html(number_formatting(data[quote].last));
  }
}

function create_tweet(destination, tweet) {
  var twitter_user_pic = '<img align="left" src="' + tweet.user.profile_image_url + '" />';
  var twitter_user_name = '<strong>' + tweet.user.screen_name + '</strong>';
  var twitter_date_time = '<span class="timeago" title="'+tweet.created_at+'">' + tweet.created_at + '</span>';
  var twitter_text = '<span class="twitter_text">' + tweet.text + '</span>';
  for(var sym in symbol_list) {
    twitter_text = twitter_text.replace(new RegExp('(' + symbol_list[sym].replace('$', '\\$') + ')','img'), '<span class="highlight">' + symbol_list[sym] + '</span>');
  }
  $(destination + ' .tweets .jspPane').prepend('<p class="tweet">' + twitter_user_pic + twitter_user_name + twitter_text + twitter_date_time + '</p><div style="clear: both;"></div>');
  $(destination + ' .tweets .jspPane .timeago').timeago();
}

function number_formatting(number_string) {
  number_string = parseFloat(number_string).toFixed(2)
  number_string += '';
  x = number_string.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}