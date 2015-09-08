// -StoryBox
// 	- StoryList
// 		- Story

// var alertStuff = function(msg) {
// 	alert(msg);
// };
// <button onClick = {alertStuff.bind(this, 'hi')}>Hi</button> // using bind allows arguments for alertStuff
// <button onClick = {alertStuff.bind(this, 'bye')}><Bye<button>

var Story = React.createClass({
	render: function() {
		var storyLink = "/news/".concat(this.props.id);
		var authorProfile = "/profile/".concat(this.props.authorId);
		return(
			<div className="story">
				<h5><a href={this.props.link}>{this.props.title}</a><span>{this.props.displayLink}</span></h5>
				<p>
				<span>{this.props.timeAgo}</span>
				<span><a href={authorProfile}>{this.props.author}</a></span>
				<span><a href={storyLink}>{this.props.commentsLength} Comments</a></span>
				</p>
				<div>
					<span>{this.props.upvote}</span>
				</div>
			</div>
		)
	}
});

var StoryList = React.createClass({
	render: function() {
		var storyNodes = this.props.stories.map(function(story) {
			return (
				<Story 
				id = {story._id}
				title = {story.title} 
				author = {story.author.username} 
				authorId = {story.author._id}
				upvote = {story.upvote} 
				commentsLength = {story.commentsLength} 
				timeAgo = {story.timeAgo} 
				link = {story.link}
				displayLink = {story.displayLink}
				>
				</Story>
			)
		});
		return(
			<div className="storyList">
				{storyNodes}
			</div>
		)
	}
});

var StoryBox = React.createClass({
	getInitialState: function() {
		return {
			stories: []
		}
	},
	getStories: function() {
		$.ajax({
			type: 'GET',
			dataType: 'json',
			url: this.props.url,
			success: function(data) {
				console.log(data);
				this.setState({stories: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		})
	},
	componentDidMount: function() {
		this.getStories();
	},
	render: function() {
		return(
			<div className="storyBox">
				<StoryList stories = {this.state.stories} />
			</div>
		)
	}
});

var url = '/news';
React.render(
	<StoryBox url = {url} />,
	document.getElementById('story')
);