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
const nunjucks = require("gulp-nunjucks-html");

const logStyles = {
  good: "color: #00ff00",
  bad: "color: #ff0000",
  okay: "color: #ffff00",
};

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
  console.log("\n\t%cReloading browser preview...\n", logStyles.good);
  browserSync.reload();
  done();
}

function devNunjucks() {
  return src(["./src/templates/*.html", "./src/templates/*.njk"])
    .pipe(
      nunjucks({
        searchPaths: ["./src/templates"],
        ext: ".html",
      })
    )
    .on("error", function (err) {
      console.log(`\n\t%c${err}`, logStyles.bad);
    })
    .pipe(dest("./dist"));
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
  watch(
    ["./src/templates/**/*.html", "./src/templates/**/*.njk"],
    series(devNunjucks, previewReload)
  );
  watch(
    ["./tailwind.config.js", "./src/scss/**/*"],
    series(devStyles, previewReload)
  );
  watch("./src/js/**/*.js", series(devScripts, previewReload));
  watch("./src/img/**/*", series(devImages, previewReload));

  console.log("\n\t%cWatching for changes...\n", logStyles.good);
}

function devClean() {
  console.log(
    "\n\t%cCleaning dist folder for fresh start...\n",
    logStyles.good
  );

  return del(["./dist"]);
}

function prodNunjucks() {
  return src(["./src/templates/*.html", "./src/templates/*.njk"])
    .pipe(
      nunjucks({
        searchPaths: ["./src/templates"],
        ext: ".html",
      })
    )
    .on("error", function (err) {
      console.log(`\n\t%c${err}`, logStyles.bad);
    })
    .pipe(dest("./public"));
}

function prodStyles() {
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
    .pipe(
      purgeCSS({
        content: ["src/**/*.{html,js,njk}"],
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
    .pipe(dest("./public/css"));
}

function prodScripts() {
  return src(["./src/js/vendor/**/*.js", "./src/js/**/*.js"])
    .pipe(
      concat({
        path: "scripts.js",
      })
    )
    .pipe(uglify())
    .pipe(dest("./public/js"));
}

function prodImages() {
  return src("./src/img/**/*").pipe(imagemin()).pipe(dest("./public/img"));
}

function prodClean() {
  console.log(
    "\n\t%cCleaning build folder for fresh start...\n",
    logStyles.good
  );

  return del(["./public"]);
}

function buildFinish(done) {
  console.log(
    '\n\t%cProduction build complete. Files located in "build".',
    logStyles.good
  );
  done();
}

exports.default = series(
  devClean,
  parallel(devStyles, devScripts, devImages, devNunjucks),
  livePreview,
  watchFiles
);

exports.prod = series(
  prodClean,
  parallel(prodStyles, prodScripts, prodImages, prodNunjucks),
  buildFinish
);

exports.clean = series(parallel(devClean, prodClean));
