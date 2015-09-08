// var HelloMessage = React.createClass({
// 	render: function() {
// 		return (
// 			<h1>Hello {this.props.name}</h1>
// 			<h2>Hello {this.props.text}</h2>
// 		);
// 	}
// });

// var WelcomeMessage = React.createClass({
// 	render: function() {
// 		return <h2>Hello {this.props.text} </h2>;
// 	}
// });
// React.render(
// 	<HelloMessage name="Stevo" text="Benjel News" />,
// 	document.getElementById('react')
// );	

/*
We are building these components:
- CommentBox
	- CommentList
		- Comment
	- CommentForm
*/
var Comment = React.createClass({
	render: function() {
		var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
		return (
			<div className="comment">
				<h2 className="commentAuthor">
					{this.props.author}
				</h2>
				<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
			</div>	
		);
	}
});
var CommentList = React.createClass({
	render: function() {
		var commentNodes = this.props.data.map(function(comment) {
			return (
				<Comment author={comment.author}>
					{comment.text}
				</Comment>
			);
		});
		return(
			<div className="commentList">
				{commentNodes}
			</div>	
		);
	}
});
var CommentForm = React.createClass({
	handleSubmit: function(e) {
		e.preventDefault();
		var author = React.findDOMNode(this.refs.author).value.trim();
		var text = React.findDOMNode(this.refs.text).value.trim();
		if (!text || !author) {
			return;
		}
		// TODO: send request to the server
		this.props.onCommentSubmit({author: author, text: text});
		React.findDOMNode(this.refs.author).value = '';
		React.findDOMNode(this.refs.text).valye = '';
		return;
	},
	render: function() {
		return(
			<form className="commentForm" onSubmit={this.handleSubmit}>
				<input type="text" placeholder="Your name" ref="author" />
				<input type="text" placeholder="Say something..." ref="text" />
				<input type="submit" value="Post" />
			</form>
		);
	}
});
var CommentBox = React.createClass({
	loadCommentsFromServer: function() {
		$.ajax({
			type: 'GET',
			url: this.props.url,
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({data: data}); // Calling this updates dynamically
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});	
	},
	handleCommentSubmit: function(comment) {
		$.ajax({
			url: '/comments',
			dataType: 'json',
			type: 'POST',
			data: comment,
			success: function(data) {
				console.log(data);
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	getInitialState: function() {
		return {data: []};
	},
	// It is a method called automatically by React when a component is rendered
	componentDidMount: function() {
		this.loadCommentsFromServer();
		//setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function() {
		return(
			<div className="commentBox">
				<h1>Comments</h1>
				<CommentList data={this.state.data} />
				<CommentForm onCommentSubmit={this.handleCommentSubmit} />
			</div>
		);
	}
});
var url = window.location.pathname + "/comments";
console.log(url);
React.render(
	<CommentBox url={url} pollInterval={10000} />,
	document.getElementById('react')	
);