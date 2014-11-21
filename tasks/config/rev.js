module.exports = function(grunt) {

  grunt.config.set('rev', {
    options: {
      algorithm: 'md5',
      length: 8
    },
    files: {
      src: [ '.tmp/public/min/production.min.js', '.tmp/public/min/production.min.css' ]
    }
  });

  grunt.loadNpmTasks('grunt-rev');
};
