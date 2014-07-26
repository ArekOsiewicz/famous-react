'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var gif = require('gulp-if');
var lr = require('gulp-livereload');
var cached = require('gulp-cached');

var merge = require('merge-stream');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');

var paths = {
  js: 'src/**/*.js',
  samples: ['src/**/*.js', 'samples/sandbox/src/**/*']
};

var bundleCache = {};
var pkgCache = {};

var bundler = watchify(browserify('./src/index.js', {
  cache: bundleCache,
  packageCache: pkgCache,
  fullPaths: true,
  standalone: 'famous-react',
  debug: true,
  insertGlobals: true
}));

var sampleBundler = watchify(browserify('./samples/sandbox/src/index.js', {
  cache: bundleCache,
  packageCache: pkgCache,
  fullPaths: true,
  standalone: 'sample',
  debug: true,
  insertGlobals: true
}));

gulp.task('watch', function(){
  bundler.on('update', function(){
    gulp.start('js');
  });
  sampleBundler.on('update', function(){
    gulp.start('samples');
  });
});

gulp.task('js', function(cb){
  var browserifyStream = bundler.bundle()
    // browserify -> gulp transfer
    .pipe(source('famous-react.js'))
    .pipe(buffer())
    .pipe(cached('js'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
    .pipe(lr());

  var lintStream = gulp.src(paths.js)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));

  return merge(browserifyStream, lintStream);
});

gulp.task('samples', function(){
  var browserifyStream = sampleBundler.bundle()
    // browserify -> gulp transfer
    .pipe(source('sample.js'))
    .pipe(buffer())
    .pipe(cached('samples'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('samples/sandbox/dist'))
    .pipe(lr());

  var staticStream = gulp.src(['samples/sandbox/src/**/*', '!samples/sandbox/src/**/*.js'])
    .pipe(cached('static-samples'))
    .pipe(gulp.dest('samples/sandbox/dist'))
    .pipe(lr());

  return merge(staticStream, browserifyStream);
});

gulp.task('default', ['js', 'samples', 'watch']);
