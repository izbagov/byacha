import gulp from "gulp";
import gulpSass from "gulp-sass";
import * as dartSass from "sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import mqpacker from "css-mqpacker";
import { deleteAsync } from "del";
import browserSync from "browser-sync";
import webpack from "webpack-stream";
import fileInclude from "gulp-file-include";
import changed from "gulp-changed";
import imagemin, { svgo, mozjpeg } from "gulp-imagemin";
import imageminPngquant from "imagemin-pngquant";
import gulpif from "gulp-if";

const isBuild = process.argv[2] === "build";

const { src, dest, series, parallel, watch, task } = gulp;

const sass = gulpSass(dartSass);

const paths = {
  src: {
    root: "./src/",
    styles: "./src/scss/**/*.scss",
    js: "./src/js/main.js",
    assets: "./src/assets/**/*",
  },
  dist: {
    root: "./dist/",
    styles: "./dist/css",
    js: "./dist/js",
    assets: "./dist/assets",
  },
};

function styles() {
  const postcssConfig = [
    autoprefixer({ cascade: false }),
    mqpacker({
      sort: function (a, b) {
        a = a.replace(/\D/g, "");
        b = b.replace(/\D/g, "");
        return b - a;
      },
    }),
  ];

  return src(paths.src.styles)
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(postcssConfig))
    .pipe(dest(paths.dist.styles))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(paths.src.js)
    .pipe(
      webpack({
        mode: "production",
        output: {
          filename: "main.js",
        },
        module: {
          rules: [
            {
              test: /\.(js|jsx)$/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: [["@babel/preset-env", { targets: "defaults" }]],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(dest(paths.dist.js))
    .pipe(browserSync.stream());
}

async function clean() {
  return await deleteAsync(["dist/*"]);
}

function html() {
  return src(paths.src.root + "**/*.html")
    .pipe(fileInclude())
    .pipe(dest(paths.dist.root));
}

function copyAssets() {
  return src(paths.src.assets)
    .pipe(changed(paths.dist.assets))
    .pipe(
      gulpif(
        isBuild,
        imagemin([
          mozjpeg({ quality: 80 }),
          imageminPngquant({ quality: [0.8, 0.9] }),
          svgo(),
        ])
      )
    )
    .pipe(dest(paths.dist.assets));
}

function watchFiles() {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
    open: false,
  });

  watch(paths.src.styles, styles);
  watch(paths.src.js, scripts);
  watch(paths.src.assets, copyAssets);
  watch("./src/**/*.html", html).on("change", browserSync.reload);
}

task("build", series(clean, parallel(styles, scripts, html, copyAssets)));
task("dev", series("build", watchFiles));
