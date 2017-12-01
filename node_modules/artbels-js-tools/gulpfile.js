var gulp = require('gulp')
var uglify = require('gulp-uglify')
var rename = require('gulp-rename')

gulp.task('default', function () {
  gulp.src('t.js')
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('t.min.js'))
    .pipe(gulp.dest('dist'))
})
