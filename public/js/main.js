$(document).ready(function() {
	$('.fav-add').click(function(event) {
		event.preventDefault();
		var ajaxUrl = $(this)[0].pathname;
		var returnUrl = window.location.href;
		$.ajax({
			url: ajaxUrl,
			type: 'POST',
			success: function(data) {
				console.log('favourited');
				console.log(data);
				window.location.href = returnUrl;
			},
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
		var self = this;
		var num = parseInt($(this).siblings('.upvote-counter')[0].innerText);
		var ajaxUrl = $(this).parent().siblings().children('.story-comments').children()[2].pathname;
		$.ajax({
			type: 'POST',
			url: ajaxUrl+'/upvote',
			success: function(data) {
				num++;
				$(self).siblings('.upvote-counter')[0].innerHTML = "<span>"+num+"</span>";
			},
			error: function(xhr, textStatus, error) {
				// TODO: show error message -> need an account to vote
				console.log(xhr+" "+textStatus+" "+error);
			}
		});
	});
	$('.upvote-minus').click(function() {
		var self = this;
		var num = parseInt($(this).siblings('.upvote-counter')[0].innerText);
		var ajaxUrl = $(this).parent().siblings().children('.story-comments').children()[2].pathname;
		$.ajax({
			type: 'POST',
			url: ajaxUrl+'/downvote',
			success: function(data) {
				num--;
				$(self).siblings('.upvote-counter')[0].innerHTML = "<span>"+num+"</span>";
			},
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