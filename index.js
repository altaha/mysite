var express = require('express')
var app = express();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cool = require('cool-ascii-faces');
var pg = require('pg');
var ArticleProvider = require('./articleprovider-mongodb').ArticleProvider;


app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.json()); // supports JSON-encoded bodies
app.use(bodyParser.urlencoded({  // to support URL encoded bodies
  extended: true
}));
app.use(require('stylus').middleware({ src: __dirname + '/public' }));
app.use(express.static(__dirname + '/public'));

var mongouri = (process.env.MONGOLAB_URI || "local");
var articleProvider = new ArticleProvider(mongouri);

app.get('/', function(req, res) {
  articleProvider.findAll(function(error, docs) {
    res.render('index.jade', {
      title: 'Blog',
      articles:docs
    });
  });
});

app.get('/blog/new', function(req, res) {
  res.render('blog_new.jade', {
    title: 'New Post'
  });
});

app.post('/blog/new', function(req, res) {
  articleProvider.save({
    title: req.body.title,
    body: req.body.body
    }, function (error, docs) {
      res.redirect('/');
  });
});

app.get('/blog/:id', function(req, res) {
    articleProvider.findById(req.params.id, function(error, article) {
        res.render('blog_show.jade',
        {
            title: article.title,
            article:article
        });
    });
});

app.post('/blog/addComment', function(req, res) {
    articleProvider.addCommentToArticle(req.body._id, {
        person: req.body.person,
        comment: req.body.comment,
        created_at: new Date()
       } , function( error, docs) {
           res.redirect('/blog/' + req.param('_id'))
       });
});


app.get('/sample', function(request, response) {
  var result = ''
  var times = process.env.TIMES || 5
  for (i=0; i < times; i++)
    result += cool()
  response.send(result);
})

app.get('/db', function(request, response) {
  pg.connect(process.env.DATABASE_URL, function(err,client,done) {
    client.query('SELECT * FROM test_table', function(err,result) {
      done();
      if (err)
      {  console.error(err); response.send("Error " + err); }
      else
      { response.send(result.rows); }
    });
  });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
