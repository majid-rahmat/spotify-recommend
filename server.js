var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var artist;

    var onSearchEnd = function(item) {
        artist = item.artists.items[0];
        var relatedReq = getFromApi('artists/' + artist.id + '/related-artists');
        relatedReq.on('end', function addRelated (artistArray) {
            artist.related = artistArray.artists;
            res.json(artist);
        });
    };

    var onError = function() {
        res.sendStatus(404);
    };

    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    
    searchReq.on('end', onSearchEnd);
    searchReq.on('error', onError);
});

app.listen(8080);