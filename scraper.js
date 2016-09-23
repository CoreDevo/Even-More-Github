var gs = require('github-scraper');
var cheerio = require('cheerio')
var request = require('request');
var repoCounter = 0;
var urlArray = new Array();
var pageCounter = 0;

//top 1000 Repos for now
function scrapeRepoLink(pageCounter){
    pageCounter++;
    request({
        method: 'GET',
        url: 'https://github-ranking.com/repositories?page=' + pageCounter
    },
    function(err, response, body) {
        if (err){
            return console.error(err);
        }

        $ = cheerio.load(body);
        $('a.list-group-item').each(function() {
                var repoLink = $(this)[0].attribs.href
                urlArray.push(repoLink)
        });

        if(pageCounter != 10){
            console.log("retrieve Repo URLs from page " + pageCounter + " done!")
            scrapeRepoLink(pageCounter)
        }else{
            console.log("starting to scrape " + urlArray.length + " repos :)")
            recursiveGetRepoLangs("/CoreDevo/Even-More-Github")
        }
    });
}



function recursiveGetRepoLangs(url){
    repoCounter++;
    gs(url, function(err, data) {
        if(data != null){
            console.log(data.langs); //do whatever with data.langs then
        }

        if(repoCounter != urlArray.length){
            recursiveGetRepoLangs(urlArray[repoCounter])
        }else{
            console.log("done")
        }
    })

}

var init = function(){
    scrapeRepoLink(pageCounter);
}();
