var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var assert = require('assert');
var tokenizer = require('stringtokenizer').getInstance();

ArticleProvider = function(uri) {

  //var uri = 'mongodb://ahmed:pass@localhost:27017/blogmongo';
  var username, pass, host, port, dbname;
  if (uri === "local") {
    username = 'ahmed';
    pass = 'pass';
    host = 'localhost';
    port = 27017;
    dbname = 'blogmongo';
  } else {
    var tokenized = tokenizer.tokenize("mongodb://{user}:{pass}@{host}.mongolab.com:{port}/{db}");
    var parsed = tokenizer.parse(uri, tokenized);

    username = parsed['user'];
    pass = parsed['pass'];
    host = parsed['host'] + '.mongolab.com';
    port = parsed['port'];
    dbname = parsed['db'];
  }

  this.db= new Db(dbname, new Server(host, port, {auto_reconnect: true}, {}));
  // Establish connection to db
  this.db.open(function(err, db) {
    assert.equal(null, err);

    // Authenticate
    db.authenticate(username, pass, function(err, result) {
      assert.equal(true, result);
    });
  });
};


ArticleProvider.prototype.getCollection= function(callback) {
  this.db.collection('articles', function(error, article_collection) {
    if( error ) callback(error);
    else callback(null, article_collection);
  });
};

ArticleProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, article_collection) {
      if( error ) callback(error)
      else {
        article_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};


ArticleProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, article_collection) {
      if( error ) callback(error)
      else {
        article_collection.findOne({_id: article_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};

ArticleProvider.prototype.save = function(articles, callback) {
    this.getCollection(function(error, article_collection) {
      if( error ) callback(error)
      else {
        if( typeof(articles.length)=="undefined")
          articles = [articles];

        for( var i =0;i< articles.length;i++ ) {
          article = articles[i];
          article.created_at = new Date();
          if( article.comments === undefined ) article.comments = [];
          for(var j =0;j< article.comments.length; j++) {
            article.comments[j].created_at = new Date();
          }
        }

        article_collection.insert(articles, function() {
          callback(null, articles);
        });
      }
    });
};

ArticleProvider.prototype.addCommentToArticle = function(articleId, comment, callback) {
  this.getCollection(function(error, article_collection) {
    if( error ) callback( error );
    else {
      article_collection.update(
        {_id: article_collection.db.bson_serializer.ObjectID.createFromHexString(articleId)},
        {"$push": {comments: comment}},
        function(error, article){
          if( error ) callback(error);
          else callback(null, article)
        });
    }
  });
};

exports.ArticleProvider = ArticleProvider;
