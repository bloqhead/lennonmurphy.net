const { src, dest, task, watch, series, parallel } = require("gulp");
const del = require("del");
const browserSync = require("browser-sync").create();

const minify = require("gulp-minify");
const sass = require("gulp-dart-sass");
const postcss = require("gulp-postcss");
const concat = require("gulp-concat");
const uglify = require("gulp-terser");
const imagemin = require("gulp-imagemin");
const cleanCSS = require("gulp-clean-css");
const purgeCSS = require("gulp-purgecss");
const autoprefixer = require("autoprefixer");

function livePreview(done) {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
    port: 5000,
  });

  done();
}

function previewReload(done) {
  console.log("\n\tReloading browser preview...\n");
  browserSync.reload();
  done();
}

function devHTML() {
  return src("./src/**/*.html").pipe(dest("./dist/"));
}

function devStyles() {
  const tailwindcss = require("tailwindcss");

  return src("./src/scss/**/*")
    .pipe(sass().on("error", sass.logError))
    .pipe(
      postcss([tailwindcss("./tailwind.config.js"), require("autoprefixer")])
    )
    .pipe(
      concat({
        path: "styles.css",
      })
    )
    .pipe(dest("./dist/css"));
}

function devScripts() {
  return src(["./src/js/vendor/**/*.js", "./src/js/**/*.js"])
    .pipe(
      concat({
        path: "scripts.js",
      })
    )
    .pipe(dest("./dist/js"));
}

function devImages() {
  return src("./src/img/**/*").pipe(dest("./dist/img"));
}

function watchFiles() {
  watch("./src/**/*.html", series(devHTML, previewReload));
  watch(
    ["./tailwind.config.js", "./src/scss/**/*"],
    series(devStyles, previewReload)
  );
  watch("./src/js/**/*.js", series(devScripts, previewReload));
  watch("./src/img/**/*", series(devImages, previewReload));

  console.log("\n\tWatching for changes...\n");
}

function devClean() {
  console.log("\n\tCleaning dist folder for fresh start...\n");

  return del(["./dist"]);
}

function prodHTML() {
  return src("./src/**/*.html").pipe(dest("./build"));
}

function prodStyles() {
  return src("./dist/css/**/*")
    .pipe(
      purgeCSS({
        content: ["src/**/*.{html,js}"],
        defaultExtractor: (content) => {
          const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
          const innerMatches =
            content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];

          return broadMatches.concat(innerMatches);
        },
      })
    )
    .pipe(
      cleanCSS({
        compatibility: "ie8",
      })
    )
    .pipe(dest("./build/css"));
}

function prodScripts() {
  return src(["./src/js/vendor/**/*.js", "./src/js/**/*.js"])
    .pipe(
      concat({
        path: "scripts.js",
      })
    )
    .pipe(uglify())
    .pipe(dest("./build/js"));
}

function prodImages() {
  return src("./src/img/**/*").pipe(imagemin()).pipe(dest("./build/img"));
}

function prodClean() {
  console.log("\n\tCleaning build folder for fresh start...\n");

  return del(["./build"]);
}

function buildFinish(done) {
  console.log('\n\tProduction build complete. Files located in "build".');
  done();
}

exports.default = series(
  devClean,
  parallel(devStyles, devScripts, devImages, devHTML),
  livePreview,
  watchFiles
);

exports.prod = series(
  prodClean,
  parallel(prodStyles, prodScripts, prodImages, prodHTML),
  buildFinish
);
