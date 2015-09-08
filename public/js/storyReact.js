/** @jsx React.DOM */
var AuthorBox = React.createClass({
	render: function() {
		return(
			<span>{this.props.author}</span>
		)
	}
})
var CommentLengthBox = React.createClass({
	render: function() {
		return(
			<span>{this.props.commentLength}</span>
		)
	}
});
var TimeBox = React.createClass({
	render: function() {
		return(
			<span>{this.props.timeAgo}</span>
		)
	}
})
var MetaBox = React.createClass({
	render: function() {
		return(
			<div className="meta">
				<CommentLengthBox comment = {this.props.commentLength} />
				<TimeBox timeAgo = {this.props.timeAgo} />
				<AuthorBox author = {this.props.author} />
			</div>
		)
	}
});
var TitleBox = React.createClass({
	getDefaultProps: function() {
		title: "Designer News"
	},
	render: function() {
		return(
			<h2>{this.props.title}</h2>
		)
	}
})
var StoryBox = React.createClass({
	propTypes: {
		//title: React.PropTypes.string.isRequired
	},
	getDefaultProps: function() {
		title: "Designer News"
	},
	render: function() {
		// var stories = this.props.data.map(function(story) {
		// 	return(
		// 		<TitleBox title={story.title} />
		// 	);
		// });
		return(
			<div className="">
				<TitleBox />
			</div>
		)
	}
})
var NewsBox = React.createClass({
	addNews: function(e) {
		// extract value from DOM
		var newMessage = this.refs.newMessage.getDOMNode().value;
		var newMessages = this.state.titles
		console.log(newMessage);
	},
	componentDidMount: function() {
		$.ajax({
			url: this.props.url,
			dateType: 'json',
			success: function(data) {
				console.log('success');
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.error(this.props.url, status, err.toString());
			}.bind(this)
		});
	},
	// validation for props
	propTypes: {
		//message: React.PropTypes.string.isRequired
	},
	getDefaultProps: function() {
		return{
			message: "Welcome"
		};
	},
	getInitialState: function() {
		return{
			message: "Benjel News"
		};
	},
	render: function() {
		return(
			<div className="container jumbotron">
				<h1>{this.props.message}</h1>
				<h2>{this.state.message}</h2>
				<input ref="newMessage" type="text" />
				<button className="btn btn-default" onClick={this.addNews}>Add</button>
				<StoryBox data={this.props.data} />
			</div>
		);
	}
});
// createClass defines the blueprints and take in an object literal
// createClass needs a render method
var MessageBox = React.createClass({
	// props
	getDefaultProps: function() {
		return{
			message: "Top News!"
		}
	},
	// state
	getInitialState: function() {
		return{
			isVisible: true
		};
	},
	render: function() {
		var inlineStyles = {
			display: this.state.isVisible ? "block" : "none"
		};
		return(
			<div className="container jumbotron" style={inlineStyles}>
				<h1>{this.props.message}</h1>
				<NewsBox data={this.props.data} />
			</div>
		);
	}
});

var data = [
	{title: 'Google News', author: 'Stevo', "commentsLength": 20, "content": "This is awesome", "link": 'http://google.ca/'},
	{title: 'Designer News', author: 'Coco', 'commentsLength': 10, 'content': 'I love design', "link": 'http://designernews.co'}
];
// 1 - the component, 2 - the container, 3 - optional callback
React.render(
	<NewsBox url="/news" />,
	document.getElementById('story'),
	function() {
		console.log('after render');
	}
)