var socket = io();

var storage = new ObservableThing([]);
function getStateFromStorage() {
  return {
    newsItems: storage.get()
  };
}

var numberOfReaders = new ObservableThing(Number(0));
function getStateFromNumberOfReaders() {
  return {
    numberOfReaders: numberOfReaders.get()
  };
}

socket.on('nxws items', function(msg) {
	var newItem = JSON.parse(msg);
  newItem.date = new Date(newItem.date);
  if (newItem.constructor == Object) newItem = [newItem];
  var currentNews = storage.get();
  var totalNews = newItem.concat(currentNews)
  storage.set(totalNews);
});

socket.on('nxws readers', function(msg) {
  console.log('Readers:', msg);
  numberOfReaders.set(Number(msg));
});

var NewsItem = React.createClass({
	render: function() {
    var fmtDate = new Date(this.props.info.date).toLocaleTimeString();
		return (
			<div className="newsItems">
				<a href={this.props.info.link} target="_blank">
					<h2>
            {this.props.info.title} <span className="itemInfo"> - {fmtDate}</span>
					</h2>
				</a>
			</div>
		);
	}
});

var NewsReaderCount = React.createClass({
  getInitialState: function() {
    return getStateFromNumberOfReaders();
  },
  componentDidMount: function() {
    numberOfReaders.setChangeListener(this.onReaderChange);
  },
  onReaderChange: function() {
    this.setState(getStateFromNumberOfReaders());
  },
	render: function() {
    var suffix = this.state.numberOfReaders == 1 ? "READER" : "READERS";
		return (
      <div  className="readercount">
        { this.state.numberOfReaders + ' ' + suffix }
      </div>
		);
	}
});

var NewsList = React.createClass({
  getInitialState: function() {
    return getStateFromStorage()
  },
  componentDidMount: function() {
    storage.setChangeListener(this.onStorageChange);
  },
  onStorageChange: function() {
    this.setState(getStateFromStorage());
  },
	render: function() {
    var makeList = function(x) {
      return <li key={x.guid}><NewsItem info={x} /></li>
    }
		return (
			<ul>
				{ this.state.newsItems.map(makeList)}
			</ul>
		);
	}
});

var NewsClock = React.createClass({
  getInitialState: function() {
    return {theTime: new Date()}
  },
  componentDidMount: function() {
    this.interval = setInterval(this.updateClock, 500);
  },
  updateClock: function() {
    this.setState({theTime: new Date()});
  },
  render: function() {
    var theTime = this.state.theTime;
    var formatttedTime = [theTime.getHours(), theTime.getMinutes(), theTime.getSeconds()]
                         .map(function(x) {return x < 10 ? '0' + x : x;}).slice(0,3).join(':');
    return (
      <div className="clock">{formatttedTime}</div>
    );
  }
});

var NewsApp = React.createClass({
	render: function() {
    return (
      <div>
        <div id="headerInfo">
          <span id="title">NXWS</span>
          <NewsClock />
          <NewsReaderCount />      
        </div>
        <div id="mainList">
          <NewsList />
        </div>        
      </div>
		);
	}
});

React.render(<NewsApp />, document.getElementById('newslistr'));
