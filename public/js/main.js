$(document).ready(function() {
	$('#getData').click(function() {
		$('.text').text('Loading....');
		$.ajax({
			type:"GET",
			url: "https://api.meetup.com/2/cities",
			success: function(data) {
				console.log(data);
				$('.text').html('');
				for (var i = 0; i < data.results.length; i++) {
					$('.text').append('<ul>');
					for (var x in data.results[i]) {
						$('.text').append("<li>" + x + ": " + data.results[i][x] + "</li>");
					}
					$('.text').append("</ul>");
				}
			},
			dataType: 'jsonp'
		});
	});
	$('.comment-submit').click(function() {
		var link = $('.link-add').attr("href");
		var jsonData = {
			comment: $('.comment-textarea').val()
		}
		$.ajax({
			type: 'POST',
			url: link + "/comment",
			data: jsonData,
			success: function(data) {
				console.log(data);
				$('.comments').append(
					"<p>"+data.content+"</p><p>"+data.author+"</p><p>"+data.created+"</p>"
				);
			},
			error: function(err){
				console.log(err);	
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

