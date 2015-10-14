/**
 * File: models/post.js
 * Defined: PostSchema
 * Description: defines the schema for posts
 * Dependencies: Mongoose
 *
 * @package grunt-osseus
 */

/* Basic Setup */
var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;


/* Creating User Schema */
var PostSchema  = new Schema({
  content: 'String',
  excerpt: 'String',
  filename: 'String',
  category: 'String',
  tags: 'Array',
  posted_date: 'Date'
});


/* Export Model */
module.exports  = mongoose.model('Post', PostSchema);
