const stream = require('stream');
const http = require('http');

const port = 8080;

const timeout = 10000;

var Feed = function(channel) {
  // Readable stream
  const readable = new stream.Readable({
    encoding: 'utf8',
  });

  var news = ["Big win", "Stocks down", "Actor sad"];

  readable._read = function () {
    if (news.length) {
      return readable.push(news.shift() + "\n");
    }

    readable.push(null);
  }

  return readable;
}

var ObjectFeed = function () {
  var readable = stream.Readable({
    objectMode: true
  });

  var objects = [
    {price: 100},
    {price: 120},
    {price: 119}
  ]

  readable._read = function () {
    if (objects.length) {
      return readable.push(JSON.stringify(objects.shift()));
    }

    return null;
  }

  return readable;
}

http.createServer(function(req, res) {
  switch (req.url) {
    case '/prices':
      handlePriceRoute(req,res);
      break;
    case '/news':
      handleNewsRoute(req,res);
      break;
    default:
      return handleNotFound(req, res);
  }
}).listen(8080)

function handlePriceRoute (req, res) {
  try {
    var objectFeed = new ObjectFeed();

    objectFeed.on('error', (err) => {
      console.log('Error in prices stream:', JSON.stringify(err));
    });
    
    res.on('error', (err) => {
        console.log('Error in write stream...');
        res.send(JSON.stringify(err));
    });
  
    setTimeout(() => {
      objectFeed.emit('end');
    }, timeout);

    objectFeed.pipe(res);
  }
  catch(e) {
    res.statusCode = 500;
    res.end();
  }
}

function handleNewsRoute (req, res) {
  try {
    var feed = new Feed();

    feed.pipe(res);
  }
  catch(e) {
    res.statusCode = 500;
    res.end();
  }
}

function handleNotFound(req, res) {
  res.statusCode = 404;
  res.end();
}