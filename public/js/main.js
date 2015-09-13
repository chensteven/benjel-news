$(document).ready(function() {
	var displayNotifications = function(data) {
		data.forEach(function(notif) {
			//comment
			for (var commentProp in notif.comment) {
				if (notif.comment.hasOwnProperty(commentProp)) {
					console.log(commentProp+": "+notif.comment[commentProp]);
				}
			}
			for (var storyProp in notif.story) {
				if (notif.story.hasOwnProperty(storyProp)) {
					console.log(storyProp+": "+notif.story[storyProp]);
				}	
			}
			for (var userProp in notif.user) {
				if (notif.user.hasOwnProperty(userProp)) {
					console.log(userProp+": "+notif.user[userProp]);
				}
			}
			console.log(notif.date);
		});
	};
	$('.user-notifications').click(function(event) {
		var returnUrl = window.location.href;
		event.preventDefault();
		$('.notification-box').toggle();
		$.ajax({
			url: '/clrnotif',
			type: 'POST',
			success: function(data) {
				console.log(data);
				$(this).children()[2].innerText = 0;
				displayNotifications(data);
				//window.location.href = returnUrl;
			}.bind(this),
			error: function(xhr, status, error) {
				console.log(xhr+' '+status+' '+error);
			}
		});
	});
	$('.reply-button').click(function(event) {
			event.preventDefault();
			$(this).siblings('.reply-form').toggle();
	});
	$(".story-favourite").on('click', '.fav-remove', function(event) {
		event.preventDefault();
		var ajaxUrl = $(this)[0].pathname;
		var returnUrl = window.location.href;
		$.ajax({
			type: 'DELETE',
			url: ajaxUrl,
			success: function(data) {
				console.log('unfavourited');
				console.log($(this));
				$(this).removeClass('fav-remove').addClass('fav-add');
				$(this).siblings()[0].innerHTML = '<span class="add-to-fav">Add to favourites</span>';
			}.bind(this),
			error: function(xhr, status, error) {
				console.log(xhr +" "+ status + " " + error);
			}
		});
	});
	$('.story-favourite').on('click', '.fav-add', function(event) {
		event.preventDefault();
		var ajaxUrl = $(this)[0].pathname;
		var returnUrl = window.location.href;
		$.ajax({
			url: ajaxUrl,
			type: 'POST',
			success: function(data) {
				console.log('favourited');
				$(this).removeClass('fav-add').addClass('fav-remove');
				$(this).siblings()[0].innerHTML = '<span class="add-to-fav"></span>';
			}.bind(this),
			error: function(xhr, status, error) {
				console.log(xhr +" "+ status + " " + error);
			}
		});
	});
	$('.btn-notifications').click(function(event) {
		
	});
	$('.btn-delete-comment').click(function(event){
		event.preventDefault();
		var ajaxUrl = $(this).children('a')[0].pathname;
		var returnUrl = window.location.href;
		$.ajax({
			url: ajaxUrl,
			type: 'DELETE',
			dateType: 'html',
			success: function(data) {
				console.log(returnUrl);
				window.location.href = returnUrl;
			},
			error: function(xhr, status, error) {
				console.log(xhr+" "+status+" "+error);
			}
		});
	});
	$('.btn-delete-story').click(function(){
		var ajaxUrl = $(this).children('a')[0].pathname;
		$.ajax({
			type: 'DELETE',
			dataType: 'html',
			url: ajaxUrl,
			success: function(data) {
				window.location.href = '/';
			},
			error: function(xhr, status, error) {
				console.log(xhr +" "+status+" "+error);
			}
		});
	});
	$('.upvote-add').click(function() {
		event.preventDefault();
		var num = parseInt($(this).parent().siblings('.story-details').children('.story-meta').children('.story-points').children()[0].innerText);
		var ajaxUrl = $(this).parent().siblings('.story-details').children('.story-meta').children()[3].pathname;
		$.ajax({
			type: 'POST',
			url: ajaxUrl+'/upvote',
			success: function(data) {
				num++;
				$(this).parent().siblings('.story-details').children('.story-meta').children('.story-points').children()[0].innerHTML = "<span>"+num+"</span>";
			}.bind(this),
			error: function(xhr, textStatus, error) {
				// TODO: show error message -> need an account to vote
				console.log(xhr+" "+textStatus+" "+error);
			}
		});
	});
	$('.upvote-minus').click(function() {
		event.preventDefault();
		var num = parseInt($(this).parent().siblings('.story-details').children('.story-meta').children('.story-points').children()[0].innerText);
		var ajaxUrl = $(this).parent().siblings('.story-details').children('.story-meta').children()[3].pathname;
		$.ajax({
			type: 'POST',
			url: ajaxUrl+'/downvote',
			success: function(data) {
				num--;
				$(this).parent().siblings('.story-details').children('.story-meta').children('.story-points').children()[0].innerHTML = "<span>"+num+"</span>";
			}.bind(this),
			error: function(xhr, textStatus, error) {
				console.log(xhr+" "+textStatus+" "+error);
			}
		});
	});
});

(function() {
	var initializeState = function() {
		console.log('Greetings, your main.js is initialized');
	}
	initializeState();
}());
	// $('#getData').click(function() {
	// 	$('.text').text('Loading....');
	// 	$.ajax({
	// 		type:"GET",
	// 		url: "https://api.meetup.com/2/cities",
	// 		success: function(data) {
	// 			console.log(data);
	// 			$('.text').html('');
	// 			for (var i = 0; i < data.results.length; i++) {
	// 				$('.text').append('<ul>');
	// 				for (var x in data.results[i]) {
	// 					$('.text').append("<li>" + x + ": " + data.results[i][x] + "</li>");
	// 				}
	// 				$('.text').append("</ul>");
	// 			}
	// 		},
	// 		dataType: 'jsonp'
	// 	});
	// });