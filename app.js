var express = require('express');
var app = express();
var fs = require('fs');
var https = require("https");
var sortJson = require('sort-json');
var json2csv = require('json2csv');
var async = require('async');
var fields = ['url','Java', 'C', 'C++', 'Python', 'C#', 'PHP','JavaScript','Perl','Ruby','Swift','Objective-C','R','MATLAB','Scala','Shell','Lua','Haskell','Bash','Go','Lisp'];
var csv = require('ya-csv');
var csvWriter = csv.createCsvFileWriter('dataset.csv');
var dataArray = [];
var output;
var combinedList = [];//NOTE:needs to be free
var starredRepoURLs = [];//NOTE:needs to be free
var starredRepoNumberCounter = 0;
var token = "7551a76448099d2afb7f31b3b0945f97e8a47a59";
var outputSent = 0;
var inputUsername = "ckyue"
var users = [inputUsername];
var userScrapedCounter = 0;
app.get('/', function (req, res) {
    //delete url key in JSON in output JSON response for pischen
    delete output['url'];
    res.send(output)
});

var GithubOAuth = function(){
    var options = {
      host :"api.github.com",
      path : '/',
      method : 'POST',
      headers: {
        'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
        'Authorization':'token '+ token
      }
    }

    var request = https.request(options, function(response){
      var body = '';
      response.on('data',function(chunk){
        body+=chunk;
      });
      response.on('end',function(){
        var json = JSON.parse(body);
        // console.log(json)
        });
      });
      request.on('error', function(e) {
        console.error('and the error is '+e);
      });
      request.end();
}();

var getMoreUsers = function(){
  var options = {
    host :"api.github.com",
    path : '/search/users?q=+followers:%3E1000&page=3&per_page=100',
    method : 'GET',
    headers: {
      'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
    }
  }

  var request = https.request(options, function(response){
    var body = '';
    response.on('data',function(chunk){
      body+=chunk;
    });
    response.on('end',function(){
      var json = JSON.parse(body);
      // console.log(json)
      json.items.forEach(function(user){
        users.push(user.login);
      });
      console.log(users)
      users.forEach(function(user){
        GetUserStarredRepo(user);
      });
    });
  });
  request.on('error', function(e) {
    console.error('and the error is '+e);
  });
  request.end();
}();

function getUsersFollowing(input){
  var options = {
    host :"api.github.com",
    path : '/users/'+input+'/following',
    method : 'GET',
    headers: {
      'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
      'Authorization':'token '+ token
    }
  }

  var request = https.request(options, function(response){
    var body = '';
    response.on('data',function(chunk){
      body+=chunk;
    });
    response.on('end',function(){
      var json = JSON.parse(body);
      // console.log(json)
      json.forEach(function(user){
        users.push(user.login);
      });
      console.log(users)
    });
  });
  request.on('error', function(e) {
    console.error('and the error is '+e);
  });
  request.end();
}

// GetUserStarredRepo("ckyue");//DEBUGGING
function GetUserStarredRepo(username){
    var options = {
      host :"api.github.com",
      path : '/users/'+username+'/starred',
      method : 'GET',
      headers: {
        'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
        'Authorization':'token '+ token
      }
    }

    var request = https.request(options, function(response){
      var body = '';
      response.on('data',function(chunk){
        body+=chunk;
      });
      response.on('end',function(){
        var json = JSON.parse(body);
        // console.log(json)
        json.forEach(function(repo){
          // console.log(repo.html_url)
          starredRepoURLs.push(repo.html_url);
        });
          // console.log(starredRepoURLs);
          starredRepoNumberCounter = starredRepoURLs.length;//NOTE: max of 30 repos returned by github api
          // console.log(starredRepoNumberCounter)
          GetUserOwnRepo(username);//DEBUGGING
      });
    });
    request.on('error', function(e) {
      console.error('and the error is '+e);
    });
    request.end();
}

function GetUserOwnRepo(username){
    var options = {
      host :"api.github.com",
      path : '/users/'+username+'/repos',
      method : 'GET',
      headers: {
        'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
        'Authorization':'token '+ token
    }
    }

    var request = https.request(options, function(response){
      var body = '';
      response.on('data',function(chunk){
        body+=chunk;
      });
      response.on('end',function(){
        var json = JSON.parse(body);
        var languages = [];
        json.forEach(function(repo){
          languages.push(repo.language);
        });
        calculateWeight(languages);
      });
    });
    request.on('error', function(e) {
      console.error('and the error is '+e);
    });
    request.end();
}

function calculateWeight(arrayElements){
    var counts = {};
    arrayElements.forEach(function(x) {
        counts[x] = (counts[x] || 0)+1;
    });
    var totalLanguages = getSum(counts);
    for(var language in counts){
        counts[language] = counts[language]/totalLanguages;
    }
    counts = sortProperties(counts);
    counts.reverse();
    var sortedList = [];
    for(var element in counts){
      counts[element] = JSON.stringify(counts[element]).replace(/,/g , ": ");
      counts[element] = counts[element].replace(/\[/g, "{");
      counts[element] = counts[element].replace(/\]/g, "}")
      sortedList.push(counts[element]);
    }
    sortedList = JSON.stringify(sortedList).replace(/["]+/g, '').replace(/\\/g, "'").replace(/'/g, '"');
    sortedList = JSON.parse(sortedList);
    combinedList = combineJsonObj(sortedList)
    if (outputSent == 0){
      output = combinedList
      // console.log(output)
      outputSent = 1;//make sure it get called once, no url is feeded to output
    }
    // console.log(combinedList);
    addToDataArray(combinedList);
    // exportToCSV(combinedList);
}
function addToDataArray(list){
  //TODO:format data array by number of user starred repo
    // console.log(starredRepoURLs)
    userScrapedCounter++;
    list["url"] = ""
    var dataArrayStrings = [];
    starredRepoURLs.forEach(function(repoLink){
      // console.log(repoLink)
      list["url"] = repoLink;
      // console.log(list)
      dataArrayStrings.push(JSON.stringify(list));//NOTE: having issue appending object into Array
    });
    //inflate strings into JSON again due to that issue LOL
    dataArrayStrings.forEach(function(string){
      // console.log(string)
      dataArray.push(JSON.parse(string));
    })

    if(userScrapedCounter == users.length){
        console.log("all scraped")
        exportToCSV(dataArray);
    }
    // console.log(dataArray);
}
function combineJsonObj(source) {
    var result = {};
    // var sources = [].slice.call(arguments, 1);
    source.forEach(function (source) {
        for (var prop in source) {
            result[prop] = source[prop];
        }
    });
    // console.log(result)
    return result;
}

function getSum(obj){
  var sum = 0;
    for(var key in obj){
        sum = sum + Number(obj[key]);
      }
    return sum
}

function sortProperties(obj)
{
    var sortable=[];
    for(var key in obj){
        if(obj.hasOwnProperty(key)){
            sortable.push([key, obj[key]]);
          }
    }
    sortable.sort(function(a, b)
    {
        var x=a[1],
            y=b[1];
        return x<y ? -1 : x>y ? 1 : 0;
    });
    return sortable;
}

//last step after appending all data into dataArray
function exportToCSV(list){
  //combinedList is an array of JSON objects
    json2csv({ data: list, fields: fields }, function(err, csv) {
        if (err) console.log(err);
          // console.log(csv);
          fs.writeFile('dataset.csv', csv, function(err) {
            if (err) throw err;
            console.log('file saved');
          });
        });
}

app.listen(3000, function () {
  console.log('listening on port 3000');
});

//bu yong le zanshi......
function asyncScrapUsers(){
  async.series([
    function getFirstFollowing(callback){
      getUsersFollowing(inputUsername);
      console.log("getting")
      callback();
    },
    function getSecondFollowing(callback){
      console.log(users)
      users.forEach(function(secondRound){
          console.log(secondRound)
          // getUsersFollowing(secondRound);
      });
      callback();
    },
    function logAllUsers(callback){
      // console.log(users)
      callback();
    }
  ]);
}
