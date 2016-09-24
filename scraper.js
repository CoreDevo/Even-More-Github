var gs = require('github-scraper');
var cheerio = require('cheerio')
var request = require('request');
var repoCounter = 0;
var userArray = new Array()
var repoUrlArray = new Array();
var pageCounter = 0;
var userCounter = 0;

//top 1000 Repos for now
function scrapeUserLink(pageCounter){
    pageCounter++;
    request({
        method: 'GET',
        url: 'https://github-ranking.com/users?page=' + pageCounter
    },
    function(err, response, body) {
        if (err){
            return console.error(err);
        }

        $ = cheerio.load(body);
        $('a.list-group-item').each(function() {
                var userLink = $(this)[0].attribs.href;
                // userLink.replace('/', "");
                userArray.push(userLink)
                // console.log(userLink)
        });

        if(pageCounter != 10){
            console.log("retrieve User URLs from page " + pageCounter + " done!")
            console.log("==========================================================")
            scrapeUserLink(pageCounter)
        }else{
            console.log("starting to scrape " + userArray.length + " repo links :)")
            console.log("==========================================================")
            // recursiveGetRepoLangs("/CoreDevo/Even-More-Github")
            recursiveGetRepoLinks("stars/ckyue")
        }
    });
}

function recursiveGetRepoLinks(user){
    userCounter++;
    gs(user, function(err, data) {
        if(data != null){
            data.entries.forEach(function(entry){
                var repoLink = entry;
                repoUrlArray.push(repoLink)
                // console.log(repoLink)
            });
        }

        if(userCounter != userArray.length){
            console.log("User scrapped: "+userCounter)
            console.log("get "+repoUrlArray.length+" repository links")
            recursiveGetRepoLinks("stars"+userArray[userCounter-1])
        }else{
            console.log("starting to scrape " + repoUrlArray.length + " repo Languages :)")
            console.log("==========================================================")
            recursiveGetRepoLangs("/CoreDevo/Even-More-Github")
        }
    })

}

function recursiveGetRepoLangs(url){
    repoCounter++;
    gs(url, function(err, data) {
        if(data != null){
            console.log(data.langs); //do whatever with data.langs then
        }

        if(repoCounter != repoUrlArray.length){
            recursiveGetRepoLangs(repoUrlArray[repoCounter-1])
        }else{
            console.log("===========================DONE===========================")
        }
    })

}

var init = function(){
    console.log("===========================INIT===========================")
    scrapeUserLink(pageCounter);
}();
