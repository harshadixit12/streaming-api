const stream = require('stream');
const https = require('https');
const fs = require('fs');
const readline = require('readline');

const defaultPort = 8080;
const port = 4430;

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

let server = https.createServer(
  {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-cert.pem')
  },
  function(req, res) {
  switch (req.url) {
    case '/prices':
      handlePriceRoute(req,res);
      break;
    case '/news':
      handleNewsRoute(req,res);
      break;
    case '/lorem-ipsum':
      handleLoremIpsum(req, res);
      break;
    default:
      return handleNotFound(req, res);
  }
});

server.listen(port);

server.setTimeout(10000, function(socket) {
  socket.write('Too slow.', 'utf8');
  socket.end();
})

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

function handleLoremIpsum(req, res) {
  console.log("Dirname: ", __dirname);
  try {
    const filePath = '/lorem-ipsum.txt';
    const file = fs.createReadStream(__dirname + filePath);
    var stat = fs.statSync(__dirname + filePath);

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*'
    });

    const rl = readline.createInterface({
      input: file,
      crlfDelay: Infinity
    });
  
    rl.on('line', (line) => {
      console.log(line, '\n<<<<<<<<<<<  >>>>>>>>>>>\n');  
      res.write(line);
    }).on('error', () => {
      console.log(error);
    });

  }
  catch (e) {
    console.log(e);
    res.statusCode = 500;
    res.end();
  }
}