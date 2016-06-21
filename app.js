var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var https = require("https");
var sortJson = require('sort-json');
var json2csv = require('json2csv');
// var async = require('async');
var fields = ['url','Java', 'C', 'C++', 'Python', 'C#', 'PHP','JavaScript','CoffeeScript','Ruby','Swift','Objective-C','Arduino','R','MATLAB','Scala','Shell','Lua','Haskell','Bash','Go','ActionScript'];
var csv = require('ya-csv');
var csvWriter = csv.createCsvFileWriter('dataset.csv');
var dataArray = [];
var backendOutput;
var combinedList = [];
var starredRepoURLs = [];
var starredRepoNumberCounter = 0;
var token = '';
var backendOutputSent = 0;
var inputUsername = "";//NOTE: manually giving it value for debugging only
var users = [];
var userScrapedCounter = 0;

//Authenticate first with Github API v3
var GithubOAuth = function(){
    var options = {
      host :"api.github.com",
      path : '/',
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
        });
      });
      request.on('error', function(e) {
        console.error('and the error is '+e);
      });
      request.end();
}();

//receiving post request from front end chrome extension
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
// POST http://localhost:3000/user
// parameters sent with
app.post('/user', function(req, res) {
    var reqUsername = req.body.username;
    console.log(reqUsername);
    inputUsername = reqUsername;
    //post to somewhere, pischen figureing out
    var postFromFrontEndFlag = 1;
    GetUserOwnRepo(inputUsername,postFromFrontEndFlag)// postToBackEnd(combinedList);
    //need to send back response
    res.send("STUFF RETURNED FROM MACHINE LEARNING");
});


//receiving post request from machine learning result
app.post('/result', function(req, res) {
    var resultReturned = req.body;
});

//*********************************************************************
//Debugging usage, need to be changed to app.post for receving front end post
app.get('/', function (req, res) {
    //delete url key in JSON in backendOutput JSON response for pischen
    // delete backendOutput['url'];
    // res.send(backendOutput)
    var postFromFrontEndFlag = 1;
    GetUserOwnRepo("ckyue",postFromFrontEndFlag)//for testing purpose
});
//*********************************************************************

function postToBackEnd(data){
  var options = {
    host :"",
    path : '',
    method : 'POST',
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
      console.log(json)//rep
    });
  });
  request.on('error', function(e) {
    console.error('and the error is '+e);
  });
  request.end();
}

var getMoreUsers = function(){
  //path: to filter users with followers >= INT
  var options = {
    host :"api.github.com",
    path : '/search/users?q=+followers:%3E1000&page=1&per_page=100',
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
      // console.log(users)
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

function GetUserOwnRepo(username, postFromFrontEndFlag){
    console.log(username)//all username scrap or requested
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
        if(postFromFrontEndFlag == 1){
            console.log("received post from Frontend, calculating Weight")
            // console.log(languages)
            calculateWeight(languages, postFromFrontEndFlag);
        }
        calculateWeight(languages, postFromFrontEndFlag);
      });
    });
    request.on('error', function(e) {
      console.error('and the error is '+e);
    });
    request.end();
}

function calculateWeight(arrayElements, postFromFrontEndFlag){
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
    if(postFromFrontEndFlag == 1){
        console.log("calculated weight:" + JSON.stringify(combinedList));
        //post to backend here
        // postToBackEnd(combinedList);//disabled till pischen give me params
    }
    // if (backendOutputSent == 0){
    //   backendOutput = combinedList
    //   // console.log(backendOutput)
    //   // console.log(output)
    //   backendOutputSent = 1;//make sure it get called once, no url is feeded to backendOutput
    // }
    // console.log(combinedList);
    addToDataArray(combinedList);
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
      // console.log("getting")
      callback();
    },
    function getSecondFollowing(callback){
      // console.log(users)
      users.forEach(function(secondRound){
          // console.log(secondRound)
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
      // console.log(users)
    });
  });
  request.on('error', function(e) {
    console.error('and the error is '+e);
  });
  request.end();
}
