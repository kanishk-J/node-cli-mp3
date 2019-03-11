#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mime = require('mime');
const async = require('async');
const {exec, spawn} = require('child_process');
var files = [];
var OS = require('os');
var homedir = OS.homedir();
var currentIndex = -1;
var runningProcess = null;
var isPlaying = false;
var isRepeat = true;
var isShuffle = false;

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    if(runningProcess)
        runningProcess.kill();
    process.exit();
  } else {
    if(key && !key.ctrl) {
        // console.log(key.name, files.length);
        switch(key.name) {
            case 'right': 
                runningProcess.kill();
                // if(currentIndex == files.length - 1) {
                //     if(isRepeat)
                //         currentIndex = 0;
                //     else currentIndex = currentIndex + 1;
                // }
                // else {
                //     console.log(currentIndex + 1);
                //     currentIndex = currentIndex + 1;
                // }
                if(currentIndex < files.length)
                    currentIndex++;
                if(currentIndex == files.length && isRepeat)
                    currentIndex = 0;
                // console.log(currentIndex);
                if(currentIndex < files.length)
                    playSong();
                break;
            case 'left':
                runningProcess.kill();
                // if(currentIndex == 0 && isRepeat)
                //     currentIndex = files.length - 1;
                // else currentIndex = currentIndex - 1;
                // renderPlaylist();
                if(currentIndex >= 0)
                    currentIndex--;
                if(currentIndex == -1 && isRepeat)
                    currentIndex = files.length - 1;
                if(currentIndex > -1)
                    playSong();
                break;
            case 'space':
                isPlaying = !isPlaying;
                renderPlaylist();
                var option = isPlaying? '-CONT': '-STOP';
                exec('killall ' + option + ' afplay');
                break;
            case 's':
                isShuffle = !isShuffle;
                renderPlaylist();
                break;
            case 'r': 
                isRepeat = !isRepeat;
                renderPlaylist();
                break;
            default:
                renderPlaylist();
                break;   
        }
    }
  }
});

function getFiles(mimeType, startDir, files, cb) {
    files = files || [];
    fs.readdir(startDir, {withFileTypes: true}, (err,dirs) => {
        async.each(dirs, (dir, callback) => {
            var filePath = startDir + "/" + dir.name;
            if(dir.isDirectory()) 
                getFiles(mimeType, filePath, files, callback);
            else if(mime.getType(filePath) == mimeType) {
                files.push({path: filePath, name: dir.name});
                return callback();
            } else return callback();
        }, function (err) {
            // console.log(cb.toString())
            return cb();
        });
    });
}

function startPlayer() {
    var msPassed = 0;
    var loadingMessage = 'Loading media';
    var interval = setInterval(() => {
        if(msPassed%400 == 0)
            loadingMessage = 'Loading media'
        else loadingMessage+= '.';
        msPassed += 500;
        console.clear();
        console.log(loadingMessage);
    }, 500);

    getFiles('audio/mpeg', homedir, files, () => {
        clearInterval(interval);
        interval = null;
        console.clear();
        if(files.length == 0) {
            console.log("No playable media found in the system");
            process.exit(0);
        } else {
            currentIndex = 0;
            isPlaying = true;
            renderPlaylist();
            playSong();
        }
    }); 
}

function renderPlaylist() {
    console.clear();
    console.log("\t#\tSong");
    console.log("-----------------------------------------------------------");
    files.forEach((file, index) => {
        var row = [];
        currentIndex == index? isPlaying? row.push('\u25B6'): row.push('\u23F8'): row.push('');
        row.push(index + 1);
        row.push(file.name);
        console.log(row.join('\t'));
    });

    console.log('\n\nREPEAT', '[' + (isRepeat? 'ON': 'OFF') + ']');
}

function playSong() {
    if(runningProcess)
        runningProcess.kill();
    isPlaying = true;
    runningProcess = exec('afplay ' + "'" + files[currentIndex].path + "'");
    renderPlaylist();
    runningProcess.on('close', (code) => {
        if(code || code == 0) {
            if(currentIndex < files.length)
                currentIndex++;
            if(currentIndex == files.length && isRepeat)
                currentIndex = 0;
            // console.log(currentIndex);
            if(currentIndex < files.length)
                playSong();
        }
    });
}

setInterval(() => {

}, 1000 * 60 * 60);

startPlayer();