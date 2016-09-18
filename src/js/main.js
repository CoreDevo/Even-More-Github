var name = $('.header-nav-current-user > strong').text();
var extensionElement = null;
if (name && name != '') {
	$.ajax ({
		url: 'https://9e2f96a9.ngrok.io/user',
		type: 'POST',
		contentType: 'application/x-www-form-urlencoded',
		charset: 'UTF-8',
		data: {
			username: name
		},
		success: function(data) {
			console.log(data);
			var arr = data['data'];
            console.log(arr);
            loopToCache(arr);
            updateView(arr);
		}, 
		error: function(e){
			console.log(e);
		}
	})
}

function loopToCache(arr) {
	chrome.storage.local.clear();
	for(var idx in arr) {
		var curr = arr[idx].replace('https://github.com','');
		var temp = arr[idx];
		(function(i,ele){
			$.ajax ({
				url: 'https://api.github.com/repos' + curr + '?access_token=' + token,
				type: 'GET',
				charset: 'UTF-8',
				success: function(data) {
					var obj = {};
					obj[ele] = data;
					chrome.storage.local.set(obj);
                    setPopOverBox(i,data);
				},  
				error: function(e){
					console.log(e);
				}
			});
		})(idx,temp);
	}
}

function setPopOverBox(idx,data){
    var popOverContainer = $(['<div class="boxed-group js-repo-filter flush pop-over-box" role="navigation">',
                            '<h3>',
                                '<span style="float:right">',
                                'Star',
                                '<span class="counter">',
                                  '8',
                                '</span>',
                                '</span>',
                            '</h3>',
                            '<div class="boxed-group-inner">',
                            '<div style="height: 200px"></div>',
                            '</div>',
                            '</div>'].join(''));
    $('#extension-ul li')
        .eq(idx)
        .append(popOverContainer);
    hide(popOverContainer);
    return popOverContainer;
}


function updateView(arr) {

	var element = $(["<div id='extension' class='boxed-group flush' role='navigation'>", 
					"<h3>Recommended Repositories <span class='counter'>5</span></h3>", 
					"<ul id='extension-ul' class='boxed-group-inner mini-repo-list'>",
					"</ul>",
					"</div>"].join(''));
    extensionElement = element;
	var svg = '<svg aria-hidden="true" class="octicon octicon-repo repo-icon" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path d="M4 9h-1v-1h1v1z m0-3h-1v1h1v-1z m0-2h-1v1h1v-1z m0-2h-1v1h1v-1z m8-1v12c0 0.55-0.45 1-1 1H6v2l-1.5-1.5-1.5 1.5V14H1c-0.55 0-1-0.45-1-1V1C0 0.45 0.45 0 1 0h10c0.55 0 1 0.45 1 1z m-1 10H1v2h2v-1h3v1h5V11z m0-10H2v9h9V1z"></path></svg>';

	$('.dashboard-sidebar').prepend(element);
	$('#extension').css("margin-top", "20px");

	for(var idx in arr) {

		var curr = arr[idx].replace('https://github.com','');
		var usrrepo = curr.split('/');

		var ele = [idx < 5 ? "<li class='public source' style='position:relative;'>" : "<li class='public source' style='position:relative;display:none'>",
					"<a href='" + curr +  "' class='mini-repo-list-item css-truncate' data-ga-click='Dashboard, click, Popular repos list item - context:user visibility:public fork:false'>",
					svg,
					"<span class='repo-and-owner css-truncate-target'>",
					"<span class='owner css-truncate-target' title='" + usrrepo[1]+ "'>" + usrrepo[1] + "</span>",
					"/",
					"<span class='repo' title='" + usrrepo[2] + "'>" + usrrepo[2] + "</span>",
					"</span></a></li>"].join('');

		$('#extension-ul').append(ele);
	}

	$('#extension-ul li a').on("mouseover", function(e){
		var url = this.href;
		e.preventDefault();
        var node = $(this);
        var popOverBox = node.parent().find('.pop-over-box');
        show(popOverBox);
        chrome.storage.local.get(url, function(items){
            console.log(popOverBox);
		});
	});
    
    $("#extension-ul li a").on("mouseleave",function(e){
        e.preventDefault();
        hide($(this).parent().find('.pop-over-box'));
    });
}


function hide(e){
    e.css({
        "display":"none"
    });
}
function show(e){
    e.css({
        "display":"block"
    });
}

