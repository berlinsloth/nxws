var socket = io();

var storage = new ObservableThing([]);
function getStateFromStorage() {
  return storage.get()
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
  getInitialState: function() {
    return { insertionTime: new Date() }
  },  
  getBaseURL: function(url) {
    if (url.slice(0,4) != 'http') {
      url = 'http://' + url;
    }
    var a = document.createElement('a');
    a.href = url;
    if (a.hostname == 'http')
      console.log(url, a.hostname)
    return a.hostname.replace(/^www./, '');
  },
	render: function() {
    var hosturl = this.getBaseURL(this.props.info.metalink);
    var fmtDate = moment(this.state.insertionTime).fromNow()
		return (
			<div className="newsItem">
				<a href={this.props.info.link} target="_blank">
					<h2>
            {this.props.info.title}
					</h2>
        </a>
        <span className="newsItemInfo"> {hosturl} – {fmtDate}</span>
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
    var numReaders = this.state.numberOfReaders;
		return (
      <div id="readerCount">
        with { numReaders + (numReaders == 1 ? ' Other' : ' Others') } 
      </div>
		);
	}
});

var NewsTimeSpent = React.createClass({
  getInitialState: function() {
    return {curTime: new Date()}
  },
  componentDidMount: function() {
    this.interval = setInterval(this.tick, 5000);
  },
  componentDidUnMount: function() {
    clearInterval(this.interval)
  },
  tick: function() {
    this.setState({curTime: new Date()});
  },
	render: function() {
    var diff = this.state.curTime - this.props.timeSpent;
    var duration = moment.duration(diff).minutes();
		return (
      <div id="timeSpent">
        in { duration + (duration == 1 ? ' Minute' : ' Minutes') } 
      </div>
		);
	}
});

var NewsItemCount = React.createClass({
	render: function() {
    var itemCount = this.props.itemCount;
    var updateText = '';
    console.log('itemCount', itemCount);
    switch (itemCount) {
      case 0: updateText = 'No News'; break;
      case 1: updateText = '1 Update'; break;
      default: updateText = itemCount + ' Updates'; break;
    }
		return (
      <div id="itemCount">
        { updateText }
      </div>
		);
	}
});

var NewsList = React.createClass({
	render: function() {
    if (this.props.newsItems.length == 0) {
      return (
        <div id="emptyList">
          <p>Just wait a little while for some news to come in.</p>
          <p id="nogoodnews">No news is good news, right?</p>
        </div>
      )
    } else {
      var makeList = function(x) {
        return <li key={x.guid}><NewsItem info={x} /></li>
      }
      var filterForText = function(x) {
        return x.title.toLowerCase().indexOf(this.props.filterText) != -1
            || x.metalink.toLowerCase().indexOf(this.props.filterText) != -1;
      }
  		return (
  			<ul>
  				{ this.props.newsItems.filter(filterForText, this).map(makeList) }
  			</ul>
  		);
    }
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
      <div id="clock">{formatttedTime}</div>
    );
  }
});

var NewsSearchBar = React.createClass({
  getInitialState: function() {
    return {filterText: ''};
  },
  handleChange: function() {
		this.props.onUserInput(
			this.refs.filterTextInput.getDOMNode().value
		);
  },
	render: function() {
    return (
      <div>
	      <input 	className="form-control"
    			ref="filterTextInput"
    			value={this.props.filterText}
    			type="search" onChange={this.handleChange}
    			placeholder="Filter"/>
      </div>
		);
	}
});

var NewsInfoItem = React.createClass({
  render: function() {
    return (
      <div>
      <p>{this.props.number}</p></div>
    )
  }
})

var NewsApp = React.createClass({
  getInitialState: function() {
    return {startTime: new Date(), filterText: '', newsItems: getStateFromStorage()};
  },
  componentDidMount: function() {
    storage.setChangeListener(this.onStorageChange);
  },
  onStorageChange: function() {
    this.setState({newsItems: getStateFromStorage()});
  },
	handleUserInput: function (filterText) {
		this.setState({filterText: filterText});
	},
	render: function() {
    return (
      <div id="mainContent">
        <div id="headerInfo">
          <NewsSearchBar onUserInput={ this.handleUserInput } filterText={this.state.filterText } />      
          <NewsItemCount itemCount={ this.state.newsItems.length }/>
          <NewsTimeSpent timeSpent={ this.state.startTime }/>
          <NewsReaderCount />  
        </div>
        <div id="mainList">
          <NewsList newsItems={this.state.newsItems} filterText={this.state.filterText.toLowerCase()} />
        </div>        
      </div>
		);
	}
});

React.render(<NewsApp />, document.getElementById('newslistr'));
