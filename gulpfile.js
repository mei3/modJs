var gulp = require('gulp'),
	uglify = require('gulp-uglify');

gulp.task('script', function() {
	gulp.src('src/*.js')
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
});