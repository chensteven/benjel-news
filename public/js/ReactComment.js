// - CommentBox
// 	- CommentList
// 		- Comment
// 	- CommentForm

var CommentBox = React.createClass({
	// initial data to render when then component is created
	getInitialState: function() {
		return {
			comments: [],
			pollInterval: 20000
		};
	},
	loadCommentsFromServer: function() {
		$.ajax({
			url: this.props.url,
			dataType: 'json',
			type: 'GET',
			success: function(data) {
				this.setState({comments: data});
				console.log('GET success');
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	handleCommentSubmit: function(comment) {
		$.ajax({
			url: this.props.url,
			dataType: 'json',
			data: comment,
			type: 'POST',
			success: function(comment) {
				console.log(comment);
				var comments = this.state.comments;
				var newComment = comments.concat([comment]);
				this.setState({comments: newComment});
				console.log('POST success');
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	componentDidMount: function() {
		this.loadCommentsFromServer();
		//setInterval(this.loadCommentsFromServer, this.state.pollInterval);
	},
	render: function() {
		return(
			<div className="commentBox">
				<CommentForm onCommentSubmit={this.handleCommentSubmit}/>
				<CommentList comments = {this.state.comments}/>

			</div>
		);
	}
});
var CommentList = React.createClass({
	render: function() {
		var commentNodes = this.props.comments.map(function(comment) {
			return(
				<Comment author={comment.author.username} id={comment.author._id} timeAgo={comment.timeAgo}>
					{comment.content}
				</Comment>
			);
		});
		return(
			<div className="commentList">
				<h4>List of Comments</h4>
					{commentNodes}
			</div>
		);
	}
})
var Comment = React.createClass({
	render: function() {
		var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
		var authorProfile = "/profile/".concat(this.props.id);
		return(
			<div className="comment">
				<span dangerouslySetInnerHTML={{__html: rawMarkup}} />
				<div className="commentAuthor">	
					<p>Posted by <a href={authorProfile}>{this.props.author}</a> {this.props.timeAgo}</p>
				</div>
			</div>
		);
	}
});
var CommentForm = React.createClass({
	handleSubmit: function(e) {
		e.preventDefault();
		var comment = React.findDOMNode(this.refs.comment).value.trim();
		if (!comment) {
			return;
		}
		this.props.onCommentSubmit({comment: comment});
		React.findDOMNode(this.refs.comment).value = '';
	},
	render: function() {
		return(
			<form className="commentForm" onSubmit={this.handleSubmit}>
				<div className="form-group">
					<textarea className="form-control" name="comment-textarea" cols="50" rows="10" required ref="comment" />
				</div>
				<button className="btn btn-default comment-add">Add a comment</button>
			</form>
		);
	}
});
var url = window.location.pathname + "/comments";
React.render(
	<CommentBox url= {url} />,
	document.getElementById('reactComment')
);