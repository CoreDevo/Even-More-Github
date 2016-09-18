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
var token = require('./src/js/token.js');
var backendOutputSent = 0;
var inputUsername = "";//NOTE: manually giving it value for debugging only
var users = [];
var userScrapedCounter = 0;
var scraper = false;

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
app.use(bodyParser.urlencoded({ extended: false })); // support encoded bodies
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// GET http://localhost:443/user
// parameters sent with
app.get('/user', function(req, res) {
    //For GET
    var reqUsername = req.query.username; // $_GET["username"]
    console.log("Received username " + reqUsername);

    //post to somewhere, pischen figureing out
    var postFromFrontEndFlag = 1;
    GetUserOwnRepo(reqUsername,postFromFrontEndFlag, res)// postToBackEnd(combinedList);
    //need to send back response
    // res.send("STUFF RETURNED FROM MACHINE LEARNING FOR: " + reqUsername);//test for Teakay
});

// GET http://localhost:443/user
// parameters sent with
app.post('/user', function(req, res) {
    //For POST from body
    var reqUsername = req.body.username;
    console.log("Received username " + reqUsername);


    //post to somewhere, pischen figureing out
    var postFromFrontEndFlag = 1;
    GetUserOwnRepo(reqUsername,postFromFrontEndFlag, res)// postToBackEnd(combinedList);
    // need to send back response
    // res.send("STUFF RETURNED FROM MACHINE LEARNING FOR: " + reqUsername);//test for Teakay
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
    console.log("/ GET")
    var postFromFrontEndFlag = 1;
    GetUserOwnRepo("ckyue",postFromFrontEndFlag,res)//for testing purpose
});
//*********************************************************************

function postToBackEnd(requestBody, res){
  var options = {
    host :"ussouthcentral.services.azureml.net",
    path : '/workspaces/f5bca8c02b6f4068afc865095eaf914e/services/38be572e4b2240c19c07a070d4a14623/execute?api-version=2.0&details=true',
    method : 'POST',
    headers: {
      'Authorization':'Bearer FJRLgRIVAj60GbOPu594KBMBfB4d00kLcgVA/ewc2oGKoX0EMqYYABm82w4HwFhddkISeNFk4ADePPxDavjcDg==',
      'Content-Type':'application/json'
    }
  }

  var request = https.request(options, function(response){
    var body = '';
    response.on('data',function(chunk){
      body+=chunk;
    });
    response.on('end',function(){
      var json = JSON.parse(body);
      var unsortedScores = {}
      var valCounter = 0;

    //   console.log(json.Results.output1.value.ColumnNames)
    // console.log(json.Results.output1.value.ColumnNames.length)
    // console.log(json.Results.output1.value.Values[0].length)

      json.Results.output1.value.ColumnNames.forEach(function(entry){
        //   console.log(entry)
          var entryName = entry.match(/\w+|"[^"]+"/g)[4];
          if(entryName != undefined){
              entryName = entryName.replace(/"/g, "");
          }else {
              entryName = "Best Fit"
          }
          unsortedScores[entryName] = json.Results.output1.value.Values[0][valCounter];
          valCounter++;
     });

     // Create items array
        var sortedScores = Object.keys(unsortedScores).map(function(key) {
            return [key, unsortedScores[key]];
        });

        // Sort the array based on the second element
        sortedScores.sort(function(first, second) {
            return second[1] - first[1];
        });
        var recommendation = {
          "data": [
          ]
        }
        for(var i = 0; i < 10; i++){
            var rand = getRandomInt(0, 50);
            recommendation.data.push(sortedScores[rand][0])
        }
        res.send(recommendation);//for Frontend
        console.log(recommendation.data)
    });
  });

  //write request body
  request.write(JSON.stringify(requestBody));

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
  if(scraper){
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
  }

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
        if (!json.forEach) return;
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

function GetUserOwnRepo(username, postFromFrontEndFlag, res){
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
        if(!json.forEach) return;
        json.forEach(function(repo){
          languages.push(repo.language);
        });
        if(postFromFrontEndFlag == 1){
            console.log("received post from Frontend, calculating Weight")
            // console.log(languages)
            calculateWeight(languages, postFromFrontEndFlag, res);
        }
      });
    });
    request.on('error', function(e) {
      console.error('and the error is '+e);
    });
    request.end();
}

function calculateWeight(arrayElements, postFromFrontEndFlag, res){
    var counts = {};
    var requestBody = {
      "Inputs": {
        "input1": {
          "ColumnNames": [
            "url",
            "HTML",
            "CSS",
            "Java",
            "C",
            "C++",
            "Python",
            "C#",
            "PHP",
            "JavaScript",
            "CoffeeScript",
            "Ruby",
            "Swift",
            "Objective-C",
            "Arduino",
            "R",
            "Scala",
            "Shell",
            "Lua",
            "Haskell",
            "Go",
            "ActionScript"
          ],
          "Values": [
            [
              "value"
            ]
          ]
        }
      },
      "GlobalParameters": {}
  };

    // console.log(requestBody.Inputs)
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
        requestBody.Inputs.input1.ColumnNames.forEach(function(entry){
            var value;
            if(combinedList[entry] == undefined){
                value = 0
            }
            else{
                value = combinedList[entry]
            }
            if(entry != "url"){
            requestBody.Inputs.input1.Values[0].push(value.toString());
            }
        });
        // console.log(requestBody.Inputs.input1.Values[0])
        // console.log(requestBody.Inputs.input1.Values[0].length)
        // console.log(requestBody.Inputs.input1.ColumnNames)
        // console.log(requestBody)

        //post to backend here

        postToBackEnd(requestBody, res);
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

app.listen(3001, function () {
  console.log('listening on port 3001');
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
      if(!json.forEach)return;
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

//random whole num
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
