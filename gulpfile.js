const { src, dest, series, parallel, watch, task } = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const mqpacker = require('css-mqpacker');
const del = require('del');
const browserSync = require('browser-sync');
const babel = require('gulp-babel');
const include = require('gulp-include');
const uglify = require('gulp-uglify');
const pipeline = require('readable-stream').pipeline;

const paths = {
  src: {
    root: './src/',
    styles: './src/scss/**/*.scss',
    js: './src/js/*.js',
    assets: './src/assets/**/*'
  },
  dist: {
    root: './dist/',
    styles: './dist/css',
    js: './dist/js',
    assets: './dist/assets'
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

  return pipeline(
    src(paths.src.styles),
    sass().on('error', sass.logError),
    postcss(postcssConfig),
    dest(paths.dist.styles),
    browserSync.stream()
  );
}

function scripts() {
  return pipeline(
    src(paths.src.js),
    include(),
    babel({
      presets: ['@babel/env']
    }),
    uglify(),
    dest(paths.dist.js),
    browserSync.stream()
  );
}

function clean() {
  return del(['dist/*']);
}

function html() {
  return src(paths.src.root + '*.html').pipe(dest(paths.dist.root));
}

function copyFiles() {
  return src(paths.src.assets).pipe(dest(paths.dist.assets));
}

function watchFiles() {
  browserSync.init({
    server: {
      baseDir: './dist'
    },
    open: false
  });

  watch(paths.src.assets, copyFiles);
  watch(paths.src.styles, styles);
  watch(paths.src.js, scripts);
  watch('./src/*.html', html).on('change', browserSync.reload);
}

task('build', series(clean, parallel(styles, scripts, html, copyFiles)));
task('dev', series('build', watchFiles));
