var gulp = require('gulp');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var cssmin = require('gulp-cssmin');
var concat = require('gulp-concat');

gulp.task('css', function() {
	return gulp.src('public/less/main.less')
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(gulp.dest('public/css'));
});
gulp.task('watch', function() {
	gulp.watch('public/less/**/*.less', ['css']);
});

gulp.task('default', ['css', 'watch']);