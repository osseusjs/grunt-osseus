/*
 * grunt-osseus
 * https://github.com/amcguinness/grunt-osseus
 *
 * Copyright (c) 2015 Andy McGuinness
 * Licensed under the MIT license.
 */

'use strict';
var markdown  = require('markdown').markdown;
var yamlFront = require('yaml-front-matter');     // will parse through files and pull out the YAML frontmatter
var mongoose  = require('mongoose');
var Post      = require('../models/post.js');

function arraysEqual(arr1, arr2) {
  if(arr1.length !== arr2.length)
    return false;
  for(var i = arr1.length; i--;) {
    if(arr1[i] !== arr2[i])
      return false;
  }
  return true;
}

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks


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
            var excerpt = post.content.split(/\n\n/g);
            post.excerpt = excerpt[0] + (excerpt[1] ? excerpt[1] : '');
            post.filename = file.split('/').pop();
            post.category = yamlFrontMatter.category;
            post.tags = yamlFrontMatter.tags;
            post.title = post.filename.substring(11).split('.')[0]; 
            post.posted_date = new Date(post.filename.substring(0, 10));
            
            Post.findOne({title: post.title}, function(err, result) {
              if (err)
                console.log(err)

              if (result) {
                var errs    = [],
                    updates = {};
                
                if (result.content !== post.content)
                  errs.push('content');
                if (result.excerpt !== post.excerpt)
                  errs.push('excerpt');
                if (result.filename !== post.filename)
                  errs.push('filename');
                if (result.category !== post.category)
                  errs.push('category');
                if (arraysEqual(result.tags, post.tags)) {
                  errs.push('tags');
                if (result.posted_date !== post.posted_date)
                  errs.push('posted_date');
                }

                if (errs.length > 0) {
                  for (var i = 0; i < errs.length; i++) {
                    updates[errs[i]] = post[errs[i]];
                  }

                  Post.update({title: post.title}, updates, {multi: true}, function (err, numAffected) {
                    if (err)
                      console.log(err);

                    if (index === newFiles.length - 1)
                      mongoose.disconnect();
                      done();
                  });
                } else {
                  if (index === newFiles.length - 1)
                    mongoose.disconnect();
                    done();
                }
              } else {
                post.save(function(err, post) {
                  if (err)
                    console.log(err);
                  if (index === newFiles.length - 1)
                    mongoose.disconnect();
                    done();
                });
              }
            });


          });
        } else {
          mongoose.disconnect();
          done();
        }
      }

      createRecurse();
    });
  });
};
