'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var mainBowerFiles = require('main-bower-files');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

// Error notifications
var reportError = function(error) {
  $.notify({
    title: 'Gulp Task Error',
    message: 'Check the console.'
  }).write(error);
  console.log(error.toString());
  this.emit('end');
};

/*
 * Configuration
 */
var config = {
  bootstrapDir: 'bower_components/bootstrap-sass/',
  fontAwesomeDir: 'bower_components/font-awesome/',
  source: './src',
  destination: './dist/'
};

var fonts = {
  in: ['src/fonts/*.*', config.bootstrapDir+'assets/fonts/*/*.*', config.fontAwesomeDir+'fonts/*.*'],
  out: 'dist/fonts/'
};

/*
 * Sass processing
 */
gulp.task('sass', function() {
  return gulp.src('src/scss/styles.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'nested',
      precision: 10,
      errLogToConsole: true,
      includePaths: [config.bootstrapDir + 'assets/stylesheets/']
    }))
    .on('error', reportError)
    .pipe($.autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.reload({stream:true}));
});

// process JS files and return the stream.
gulp.task('js-move', function () {
  return gulp.src('src/js/**/*.js')
    .pipe(gulp.dest('dist/js'));
});

// Optimize Images
gulp.task('images', function() {
  return gulp.src('src/images/**/*')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{
        cleanupIDs: false
      }]
    }))
    .pipe(gulp.dest('dist/images'));
});

// JS hint
gulp.task('jshint', function() {
  return gulp.src('src/js/*.js')
    .pipe(reload({
      stream: true,
      once: true
    }))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'));
});

// Beautify JS
gulp.task('beautify', function() {
  gulp.src('src/js/*.js')
    .pipe($.beautify({indentSize: 2}))
    .pipe(gulp.dest('scripts'));
});

// Compress JS
gulp.task('compress', function() {
  return gulp.src('src/js/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('scripts'));
});

// Run drush to clear the theme registry
gulp.task('drush', function() {
  return gulp.src('', {
      read: false
    })
    .pipe($.shell([
      'drush cc views',
    ]));
});

// BrowserSync
gulp.task('browser-sync', function() {
  var files = [
    'src/scss/**/*.scss',
    'src/js/**/*.js',
    'src/images/**/*',
    'templates/**/*.twig'
  ];
  browserSync.init(files, {
    proxy: {
      target: "http://localhost"
    },
    open: false,
    injectChanges: false
    //online: true
  });
});

/*
 * Move fonts to dist/fonts/
 */
gulp.task('fonts-move', function() {
  return gulp.src(fonts.in)
    .pipe(gulp.dest(fonts.out));
});

/*
 * Move main bower files to dist/libraries/
 */
gulp.task('bower-move', function() {
  var options = {
    debug: true,
    checkExistence: true
  };
  return gulp.src(mainBowerFiles(options))
    .pipe(gulp.dest('./dist/libraries/'))
});

gulp.task('dist-clean', function() {
  var dirsToRemove = [
    'dist/css',
    'dist/fonts',
    'dist/images',
    'dist/js',
    'dist/libraries'
  ];
  return gulp.src(dirsToRemove, {read:false})
    .pipe($.clean());
});

gulp.task('deploy', function(callback) {
  runSequence('dist-clean', 'bower-move', 'fonts-move', 'js-move', 'images', 'sass', callback);
});

/*
 * Default task
 */
gulp.task('default', ['sass', 'browser-sync', 'drush'], function() {
  gulp.watch("src/js/**/*.js", ['js-move']);
  gulp.watch('src/scss/**/*.scss', ['sass']);
  gulp.watch('bower_components/**/*', ['move-files']);
});
