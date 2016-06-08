var express = require('express');
var app = express();
var https = require("https");
var sortJson = require('sort-json');
//get more users
var userName='ckyue';
var options = {
host :"api.github.com",
path : '/users/'+userName+'/repos',
method : 'GET',
headers: {'User-Agent':'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'}
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

function calculateWeight(arrayElements){
    var counts = {};
    arrayElements.forEach(function(x) {
        counts[x] = (counts[x] || 0)+1;
    });
    // console.log(counts);
    var totalLanguages = getSum(counts);
    // console.log(totalLanguages);
    for(var language in counts){
        // console.log(counts[language])
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
    // sortedList = JSON.stringify(sortedList).replace("'","");
    console.log(sortedList);
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

function exportToCSV(){

}
