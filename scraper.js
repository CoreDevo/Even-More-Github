var gs = require('github-scraper');
var urlArray = ['/CoreDevo/Drop-The-Beat',
                '/CoreDevo/ExpresSJ',
                '/CoreDevo/FGiP',
                '/CoreDevo/LeapRevo'
                ]
var repoCounter = 0;

function recursiveGetRepoLangs(url){
    repoCounter++;
    gs(url, function(err, data) {
        console.log(data.langs); // or what ever you want to do with the data
        if(repoCounter != urlArray.length){
            recursiveGetRepoLangs(urlArray[repoCounter])
        }
    })

}

recursiveGetRepoLangs("/CoreDevo/Even-More-Github")
