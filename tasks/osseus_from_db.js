/*
 * grunt-osseus
 * https://github.com/amcguinness/grunt-osseus
 *
 * Copyright (c) 2015 Andy McGuinness
 * Licensed under the MIT license.
 */

'use strict';
var mongoose  = require('mongoose');
var Post      = require('../models/post.js');

function search(nameKey, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].substring(11).split('.')[0] === nameKey) {
      return array[i];
    }
  }
}

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks


  grunt.registerMultiTask('osseus_from_db', 'Grunt plugin to read YAML frontmatter and insert data into a database via an API url.', function() {
    var done = this.async();    // telling Grunt this is going to involve asynchronous tasks
    mongoose.connect('mongodb://localhost/osseus');

    var options = this.options({
      encoding: 'utf-8'
    });

    var fileObj = {};

    if (this.files.length > 0) {
      this.files.forEach(function(file) {
        function deleteRecurse () {
          if (file.src.length > 0) {
            var newFiles = file.src.filter(function(filepath){
              if (filepath.split('/').pop() !== '.gitignore') {
                return true;
              } else {
                return false;
              }
            });
          } else {
            var newFiles = [];
          }

          Post.find({}, function(err, results) {
            if (err)
              console.log(err);

            if (results.length > 0) {

              for (var i = 0; i < results.length; i++) {
                var result = search(results[i].title, newFiles);  
                
                if (!result) {
                  Post.find({title: results[i].title}).remove().exec();
                  if (i === results.length - 1) {
                    mongoose.disconnect();
                    done();
                  }
                } else {
                  if (i === results.length - 1) {
                    mongoose.disconnect();
                    done();
                  }
                }
              }
            } else {
              mongoose.disconnect();
              done();
            } 
          });
        }

        deleteRecurse();
      });
    }
  });
};
