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
var ejs       = require('ejs');
var fs        = require('fs');
var yamlFront = require('yaml-front-matter');     // will parse through files and pull out the YAML frontmatter

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks


  grunt.registerMultiTask('osseus_compile', 'Grunt plugin to compile and create HTML pages based on a source directory and a dist directory, as well as a templating engine.', function() {
    var done = this.async();    // telling Grunt this is going to involve asynchronous tasks
    mongoose.connect('mongodb://localhost/osseus');

    var options = this.options({
      encoding: 'utf-8'
    });

    function fileRecurse (fileName, root) {
      grunt.file.recurse(root, function (abspath, rootdir, subdir, filename) {
        if (filename === fileName) {
          grunt.file.delete(abspath); 
        }
      });
    }
    
    var theme = this.options().theme;

    this.files.forEach(function(file) {
      // Parse through each page in the pages dir
      grunt.file.recurse(file.src + '/pages', function(abspath, rootdir, subdir, filename) {
        var targetDir   = '',
            filePre     = filename.split('.')[0],
            parseMethod = filename.split('.')[1];
        
        // If we're looking at the basic index.html file, the destination is just the target
        if (filePre === 'index') {
          targetDir = file.dest; 
        } else { // otherwise, we need a subdirectory
          targetDir = file.dest + '/' + filename.split('.')[0];
        }

        fileRecurse('index.html', targetDir); // delete any index.htmls that exist

        // Step 1 -- parse the code for the page
        var fileContents = grunt.file.read(abspath); // read the page's content
        var yamlFrontMatter = yamlFront.loadFront(fileContents); // get the YAML frontmatter
        yamlFrontMatter.body = ejs.render(yamlFrontMatter.__content); // EJS parse the content of the page
        yamlFrontMatter.filename = file.src + 'themes/' + theme + '/layouts/' + yamlFrontMatter.layout + '.ejs';
        yamlFrontMatter.author = global.config.author;
        var content = ejs.render(fs.readFileSync(file.src + 'themes/' + theme + '/layouts/' + yamlFrontMatter.layout + '.ejs', 'utf8'), yamlFrontMatter); // EJS parse the layout of the page
        grunt.file.write(targetDir + '/index.html', content); // write the finished content to a page
        done();
      }); 
    });
  });
};
