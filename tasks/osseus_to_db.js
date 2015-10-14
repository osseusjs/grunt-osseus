/*
 * grunt-osseus-to-db
 * https://github.com/amcguinness/grunt-osseus-to-db
 *
 * Copyright (c) 2015 Andy McGuinness
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  var markdown  = require('markdown').markdown;
  var yamlFront = require('yaml-front-matter');     // will parse through files and pull out the YAML frontmatter
  var mongoose  = require('mongoose');
  var Post      = require('../models/post.js');

  grunt.registerMultiTask('osseus_to_db', 'Grunt plugin to read YAML frontmatter and insert data into a database via an API url.', function() {
    var done = this.async();    // telling Grunt this is going to involve asynchronous tasks
    mongoose.connect('mongodb://localhost/osseus');

    var options = this.options({
      encoding: 'utf-8'
    });

    var fileObj = {};

    this.files.forEach(function(file) {
      function createRecurse () {
        var newFiles = file.src.filter(function(filepath){
          if (filepath.split('/').pop() !== '.gitignore') {
            return true;
          } else {
            return false;
          }
        });

        if (newFiles.length > 0) {
          newFiles.forEach(function(file, index, arr) {
            var post = new Post();
            var fileContents = grunt.file.read(file);
            var yamlFrontMatter = yamlFront.loadFront(fileContents);
            post.content = markdown.toHTML(yamlFrontMatter.__content, 'Gruber');
            var excerpt = yamlFrontMatter.content.split(/\n\n/g);
            post.excerpt = excerpt[0] + (excerpt[1] ? excerpt[1] : '');
            post.filename = file.split('/').pop();
            post.category = yamlFrontMatter.category;
            post.tags = yamlFrontMatter.tags;

            
            post.save(function(err, post) {
              if (err)
                console.log(err);
            });

            if (index === newFiles.length - 1)
              done();
          
          });
        } else {
          done();
        }
      }

      createRecurse();
    });
  });

};
