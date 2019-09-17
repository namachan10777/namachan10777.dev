const gulp = require('gulp');
const elm = require('gulp-elm');

gulp.task('elm', () => {
  return gulp.src('src/Main.elm')
    .pipe(elm.bundle('elm.js', elm({ optimize: true })))
    .pipe(gulp.dest('dist'));
});

gulp.task('html', () => {
  return gulp.src('*.*html')
    .pipe(gulp.dest('dist/'));
});

gulp.task('css', () => {
  return gulp.src('*.css')
    .pipe(gulp.dest('dist/'));
});

gulp.task('res', () => {
  return gulp.src('res/*')
    .pipe(gulp.dest('dist/res'));
});

gulp.task('default', gulp.series(gulp.parallel('elm', 'html', 'css', 'res')));
