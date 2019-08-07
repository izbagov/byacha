const { src, dest, series, parallel, watch, task } = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const del = require('del');
const browserSync = require('browser-sync');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const include = require('gulp-include');

const paths = {
  src: {
    root: './src/',
    styles: './src/scss/**/*.scss',
    js: './src/js/*.js'
  },
  dist: {
    root: './dist/',
    styles: './dist/css',
    js: './dist/js'
  }
};

function styles() {
  const postcssConfig = [
    autoprefixer({ cascade: false }),
    mqpacker({
      sort: function(a, b) {
        a = a.replace(/\D/g, '');
        b = b.replace(/\D/g, '');
        return b - a;
      }
    })
  ];

  return src(paths.src.styles)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(postcssConfig))
    .pipe(dest(paths.dist.styles))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(paths.src.js)
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(include())
    .pipe(uglify())
    .pipe(dest(paths.dist.js))
    .pipe(browserSync.stream());
}

function clean() {
  return del(['dist/*']);
}

function html() {
  return src(paths.src.root + '*.html').pipe(dest(paths.dist.root));
}

function watchFiles() {
  browserSync.init({
    server: {
      baseDir: './dist'
    },
    open: false
  });

  watch(paths.src.styles, styles);
  watch(paths.src.js, scripts);
  watch('./src/*.html', html).on('change', browserSync.reload);
}

task('build', series(clean, parallel(styles, scripts, html)));
task('dev', series('build', watchFiles));
