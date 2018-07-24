var express = require('express');
var bodyParser = require('body-parser');
var NodeGeocoder = require('node-geocoder');
var Twit = require('twit');
var sentiment = require('sentiment');
var app = express();



var keys = require('./keys'); //I've split up the multiple api keys ill be needing
var twitterKeys = keys.twitter;
var geoKeys = keys.nodeGeo;

var Twitter = new Twit(twitterKeys);
var geocoder = NodeGeocoder(geoKeys);


const hostname = '127.0.0.1';
const port = 3000;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views')

app.use('/assets', express.static('assets'));
app.use('/', bodyParser.urlencoded({ extended: false }));

//this is for homepage
app.get('/homePage', function(req, res) {
    res.render('mainPage');
});

app.post('/homePage', function(req, res) {
    
    res.status(100);
    res.redirect('/userAddress')
});  


//this is for entering address page
app.get('/userAddress', function(req, res) {

    res.render('enterAddress');
});

app.post('/userAddress', function(req, res) {
    res.status(100);
    res.redirect('/pleb-tweet-results?address=' + JSON.stringify(req.body.address));
});  


app.get('/pleb-tweet-results', function(req, res) {
    var count = 101;
    var place = req.query.address;
    geocoder.geocode(place)
    .then(function(response) {
      var address = response[0].latitude + ',' + response[0].longitude;
  
  
        //querying twitter for tweets
        Twitter.get('search/tweets', {result_type: 'recent',
        geocode: address +',50km',lang: 'en',
        q: 'plebiscite', count: count}, function(error, tweets, response) {
            var tweetArr = [];
            var Positive = 0;
            var Negative = 0;
            var Neutral = 0;
            var arrLength = tweets.statuses.length;
            //looping through results and putting  them in variables
            for (i = 0; i < tweets.statuses.length; i++) {   
                    tweetArr.push(tweets.statuses[i].text);


                // analysing for sentiment and sorting
                var r1 = sentiment(tweets.statuses[i].text);
                if (r1.score > 0) {
                    Positive = Positive + 1;
                } else if (r1.score < 0) {
                    Negative = Negative + 1;
                } else if (r1.score == 0) {
                    Neutral = Neutral + 1;
                }
            }
            var percentPositive = (Positive / tweets.statuses.length) * 100;
            var percentNegative = (Negative / tweets.statuses.length) * 100;
            var percentNeutral = (Neutral / tweets.statuses.length) * 100;
         res.render('results', {percentNegative, percentNeutral,percentPositive,arrLength,place});
        });
    })
    .catch(function(err) {
      console.log(err);
    });
    
});




app.listen(3000)

console.log('server restarted on port %d',port);
