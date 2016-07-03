packets = {
  handle:function(client) {
    var symbols = new Array();
    client.on('watchlist-stream',function() {
      tradeking_consumer.get(tradeking.api_url+'/watchlists/DEFAULT.json', tradeking.access_token, tradeking.access_secret, function(error, data, response) {
        watchlist = JSON.parse(data)
        console.log('send client their watchlist')
        client.emit('watchlist-symbols', watchlist.response)
        var track = new Array();
        symbols = new Array();

        watchlist.response.watchlists.watchlist.watchlistitem.forEach(function(item) {
          track.push("$" + item.instrument.sym);
          symbols.push(item.instrument.sym);
        });

        twitter_client.stream('statuses/filter', {track:track.join(',')}, function(stream) {
          stream.on('data', function (data) {
              console.log(data)
            client.emit('tweet', data);
          });
          stream.on('error', function(err) {
            console.log(err);
          });
        });
      });
    });

    client.on('watchlist-poll', function() {
      tradeking_consumer.get(tradeking.api_url +'/market/ext/quotes.json?symbols=AAPL,SPY,' + symbols.toString(), tradeking.access_token, tradeking.access_secret, function(error, data, response) {
        quotes = JSON.parse(data);
        console.log('send client their watchlists quotes');
        console.log(quotes.response.quotes);
        if(quotes.response.type != "Error") {
          client.emit('watchlist-quotes', quotes.response.quotes.quote);
        }
      });
    });

    client.on('remove-symbol', function(symbol) {
      tradeking_consumer.delete(tradeking.api_url+'/watchlists/DEFAULT/symbols/' + escape(symbol) + '.json', tradeking.access_token, tradeking.access_secret, function(error, data, response) {
        client.emit('symbol-removed', symbol);
        twitter_client.updateStatus('I stopped watching $' + symbol, function(data) {
         console.log(data);
        });
      });
    });

    client.on('add-symbol', function(symbol) {
      tradeking_consumer.post(tradeking.api_url+'/watchlists/DEFAULT/symbols.json', tradeking.access_token, tradeking.access_secret, 'symbols=' + symbol.toUpperCase(), function(error, data, response) {
        client.emit('symbol-added', quotes.response);
        twitter_client.updateStatus('I started watching $' + symbol, function(data) {
         console.log(data);
        });
      });
    });

    client.on('index-poll', function() {
      tradeking_consumer.get(tradeking.api_url+'/market/ext/quotes.json?symbols=DJI,SPX,VIX,COMP,RUT,TNX', tradeking.access_token, tradeking.access_secret, function(error, data, response) {
        quotes = JSON.parse(data);
        console.log('send client their index quotes');
        console.log(quotes)
        if(quotes.response.type != "Error") {
          client.emit('index-symbols', quotes.response.quotes.quote);
          console.log(quotes.response.quotes.quote);
        }
      });
    });

    client.on('execute_trade', function(data) {
      /************************************************************************************************************************
       This trading section is a work in progress.
       In our initial version of the app we had a very simple tradeticket set up.
       However, with the updated trade ticket, a few more connections need to be made before it's completely working again.
       Feel free to uncomment this and try connecting the new trade ticket form to this call (try a preview call first).
      *************************************************************************************************************************/

      // extract trade info out of the data
      // symbol = data[0].value
      // quantity = data[1].value
      // buysell = data[2].value

      // Default account number -- insert yours here
      // account_number = '';
      // body = [
      //   '<FIXML xmlns="http://www.fixprotocol.org/FIXML-5-0-SP2">',
      //   '<Order TmInForce="0" Typ="1" Side="1" Acct="'+account_number+'">',
      //   '<Instrmt SecTyp="CS" Sym="'+symbol+'"/>',
      //   '<OrdQty Qty="'+quantity+'"/>',
      //   '</Order>',
      //   '</FIXML>'
      // ].join('')
      //
      // headers = { "Accept" : "*/*",
      //             "Connection" : "close",
      //             "User-Agent" : "Node authentication",
      //             "TKI_OVERRIDE": "true"
      //           }
      //
      // new oauth.OAuth(
      //   "https://developers.tradeking.com/oauth/request_token",
      //   "https://developers.tradeking.com/oauth/access_token",
      //   tradeking.consumer_key,
      //   tradeking.consumer_secret,
      //   "1.0",
      //   "http://localhost:3000/tradeking/callback",
      //   "HMAC-SHA1", 32, headers).post(tradeking.api_url+'/accounts/'+account_number+'/orders.json', tradeking.access_token, tradeking.access_secret, body,
      //
      //   function(error, data, response) {
      //     console.log('trade received!')
      //     console.log(data)
      //
      //     trade = JSON.parse(data);
      //
      //     if(trade.response.type != "Error" && trade.response.clientorderid != '') {
      //       client.emit('trade-completed', trade.response.clientorderid);
      //
      //       twitter_client.updateStatus('I just traded '+quantity+'+ shares of $' + symbol, function(data) {
      //        console.log(data);
      //       });
      //     }
      //   }
      // );
    });
  }
}
exports.packets = packets;
