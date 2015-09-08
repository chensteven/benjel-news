var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less'); // compiles less
var autoprefixer = require('gulp-autoprefixer'); // add prefixes
var concat = require('gulp-concat'); // combine files
var cssmin = require('gulp-cssmin'); // minify css
var uglify = require('gulp-uglify'); // minify js
var gulpif = require('gulp-if'); // if else in gulp
var plumber = require('gulp-plumber'); // fixes error in gulp
var browserify = require('browserify'); // a frontend module management system that allows require modules in browser like node
var babelify = require('babelify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');

var production = process.env.NODE_ENV === 'production';
var dependencies = [
	'alt',
	'flux',
	'react',
	'react-router',
	'underscore',
];
var dirName = 'bower_components/';

/** Combine all JS libs */
 gulp.task('js', function() {
	return gulp.src([
		dirName+"jquery/dist/jquery.js",
		dirName+"bootstrap/dist/js/bootstrap.js"
	])
		.pipe(concat('vendor.js')) 
		.pipe(gulpif(production, uglify({mangle: false})))
		.pipe(gulp.dest('public/js'));
 });
 
 /** compile third-party dependencies **/
 gulp.task('browserify-vendor', function() {
 	return browserify()
 		.require(dependencies)
 		.bundle()
 		.pipe(source('vendor.bundle.js'))
 		//.pipe(gulpif(production, streamify(uglify({mangle: false}))))
 		.pipe(gulp.dest('public/js'));
 });
 /**  compile only project files and not third party dependencies **/
 gulp.task('browserify', ['browserify-vendor'], function() {
 	return browserify('app/main.js')
	 	.external(dependencies)
	 	.transform(babelify)
	 	.bundle()
	 	.pipe(source('bundle.js'))
	 	//.pipe(gulpif(production, streamify(uglify({mangle: false}))))
	 	.pipe(gulp.dest('public/js'));
 });

 /** browserify task but will watch for changes and recompile */
 gulp.task('browserify-watch', ['browserify-vendor'], function() {
 	var bundler = watchify(browserify('app/main.js', watchify.args));
 	bundler.external(dependencies);
 	bundler.transform(babelify);
 	bundler.on('update', rebundle);
 	return rebundle();
 	function rebundle() {
 		var start = Date.now();
 		return bundler.bundle()
 			.on('error', function(err) {
 				gutil.log(gutil.colors.red(err.toString()));
 			})
 			.on('end', function() {
 				gutil.log(gutil.colors.green('Finished rebundling in ', (Date.now() - start) + 'ms.'));
 			})
 			.pipe(source('bundle.js'))
 			.pipe(gulp.dest('public/js'));
 	}
 });
/** Compile LESS stylesheets */
 gulp.task('css', function() {
	return gulp.src('app/stylesheets/main.less')
		.pipe(plumber())
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(gulpif(production, cssmin()))
		.pipe(gulp.dest('public/css'));	 
 });
 
 gulp.task('watch', function() {
	gulp.watch('app/stylesheets/**/*.less', ['css']); 
 });
 
 gulp.task('default', ['css', 'js', 'watch']);
 gulp.task('build', ['css', 'js', 'browserify']);