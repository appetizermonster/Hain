'use strict';

const cp = require('child_process');
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const packager = require('electron-packager');
const path = require('path');
const install = require('gulp-install');
const zip = require('gulp-zip');
const electronInstaller = require('electron-winstaller');
const fs = require('fs');
const del = require('del');
const replace = require('gulp-replace');
const appPkg = require('./app/package.json');

gulp.task('deps', () => {
  return gulp.src('./app/package.json')
    .pipe(install({ production: true }));
});

gulp.task('clean:renderer', () => {
  return del(['./app/renderer']);
});

gulp.task('renderer', ['deps', 'clean:renderer'], () => {
  const js = gulp.src('./app/renderer-jsx/**/*.js*')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015', 'react']
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./app/renderer'));
  return js;
});

function build(arch, platform, icon) {
  return new Promise((resolve, reject) => {
    packager({
      arch,
      name: 'Hain',
      dir: path.join(__dirname, 'app'),
      platform: platform || 'win32',
      asar: true,
      ignore: /(renderer-jsx|__tests__)/gi,
      overwrite: true,
      out: path.join(__dirname, 'out'),
      icon: path.join(__dirname, 'build', icon || 'icon.ico'),
      'version-string': {
        ProductName: 'Hain',
        CompanyName: 'Heejin Lee'
      }
    }, (err, appPath) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      return resolve();
    });
  });
}

function buildZip(arch) {
  const filename = `Hain-${arch}-v${appPkg.version}.zip`;
  return gulp.src(`./out/Hain-win32-${arch}/**/*`)
            .pipe(zip(filename))
            .pipe(gulp.dest('./out/'));
}

// Workaround to build zip file which is including symlinks
function buildZipUsingExec(arch, platform, filesToCompress) {
  const filename = `hain-${platform}-${arch}-v${appPkg.version}.zip`;
  const targetDir = `Hain-${platform}-${arch}`;
  const workingDir = path.join(__dirname, 'out', targetDir);
  return new Promise((resolve, reject) => {
    cp.exec(`zip --symlinks -r ../${filename} ${filesToCompress}`, {
      cwd: workingDir
    }, (err, stdout, stderr) => {
      if (err) {
        console.log(stdout);
        console.log(stderr);
        return reject(err);
      }
      return resolve();
    });
  });
}

function buildInstaller(arch) {
  const filename = `HainSetup-${arch}-v${appPkg.version}.exe`;
  return electronInstaller.createWindowsInstaller({
    appDirectory: path.resolve(`./out/hain-win32-${arch}`),
    outputDirectory: `./out/${arch}`,
    authors: 'Heejin Lee',
    title: 'Hain',
    iconUrl: 'https://raw.githubusercontent.com/hainproject/Hain/master/build/icon.ico',
    setupIcon: path.resolve('./build/icon.ico'),
    loadingGif: path.resolve('./build/installer.gif'),
    skipUpdateIcon: true, // HACK to resolve rcedit error (electron-winstaller)
    noMsi: true
  }).then(() => {
    fs.renameSync(`./out/${arch}/Setup.exe`, `./out/${filename}`);
  });
}

function buildDebianPkg() {
  const electronDebianPkg = require('electron-installer-debian');
  const options = {
    src: 'out/hain-linux-x64/',
    dest: 'out/installers/',
    arch: 'amd64'
  };

  return new Promise((resolve, reject) => {
    electronDebianPkg(options, function (err) {
      if (err) {
        console.log(err);
        return reject(err);
      }

      return resolve();
    });
  });
}

gulp.task('build', ['renderer', 'deps'], () => {
  return build('ia32')
    .then(() => build('x64'));
});

gulp.task('build-zip-ia32', ['build'], () => buildZip('ia32'));
gulp.task('build-zip-x64', ['build'], () => buildZip('x64'));
gulp.task('build-zip', ['build-zip-ia32', 'build-zip-x64']);

gulp.task('build-debian', ['renderer'], () => {
  return build('x64', 'linux')
    .then(() => buildDebianPkg());
});

gulp.task('build-darwin', ['renderer', 'deps'], () => {
  return build('x64', 'darwin', 'icon.icns')
    .then(() => buildZipUsingExec('x64', 'darwin', '*.app'));
});

gulp.task('build-installer', ['build', 'build-zip'], () => {
  return buildInstaller('ia32')
    .then(() => buildInstaller('x64'));
});

gulp.task('build-chocolatey', () => {
  return gulp.src('./chocolatey/**/*')
    .pipe(replace('${version}', appPkg.version))
    .pipe(gulp.dest('./out/chocolatey/'));
});

gulp.task('build-all', ['build-zip', 'build-installer', 'build-chocolatey']);

gulp.task('watch', ['renderer'], () => {
  const opts = {
    debounceDelay: 2000
  };
  gulp.watch('./app/renderer-jsx/**/*', opts, ['renderer']);
});

gulp.task('default', ['renderer']);
