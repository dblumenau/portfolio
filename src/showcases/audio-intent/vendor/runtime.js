// @ts-nocheck
// Generated from hashed retained source by compile.mjs; see runtime.d.ts.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf, __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: !0 }) : target,
  mod
));

// node_modules/howler/dist/howler.js
var require_howler = __commonJS({
  "node_modules/howler/dist/howler.js"(exports) {
    (function() {
      "use strict";
      var HowlerGlobal2 = function() {
        this.init();
      };
      HowlerGlobal2.prototype = {
        /**
         * Initialize the global Howler object.
         * @return {Howler}
         */
        init: function() {
          var self2 = this || Howler3;
          return self2._counter = 1e3, self2._html5AudioPool = [], self2.html5PoolSize = 10, self2._codecs = {}, self2._howls = [], self2._muted = !1, self2._volume = 1, self2._canPlayEvent = "canplaythrough", self2._navigator = typeof window < "u" && window.navigator ? window.navigator : null, self2.masterGain = null, self2.noAudio = !1, self2.usingWebAudio = !0, self2.autoSuspend = !0, self2.ctx = null, self2.autoUnlock = !0, self2._setup(), self2;
        },
        /**
         * Get/set the global volume for all sounds.
         * @param  {Float} vol Volume from 0.0 to 1.0.
         * @return {Howler/Float}     Returns self or current volume.
         */
        volume: function(vol) {
          var self2 = this || Howler3;
          if (vol = parseFloat(vol), self2.ctx || setupAudioContext(), typeof vol < "u" && vol >= 0 && vol <= 1) {
            if (self2._volume = vol, self2._muted)
              return self2;
            self2.usingWebAudio && self2.masterGain.gain.setValueAtTime(vol, Howler3.ctx.currentTime);
            for (var i = 0; i < self2._howls.length; i++)
              if (!self2._howls[i]._webAudio)
                for (var ids = self2._howls[i]._getSoundIds(), j = 0; j < ids.length; j++) {
                  var sound = self2._howls[i]._soundById(ids[j]);
                  sound && sound._node && (sound._node.volume = sound._volume * vol);
                }
            return self2;
          }
          return self2._volume;
        },
        /**
         * Handle muting and unmuting globally.
         * @param  {Boolean} muted Is muted or not.
         */
        mute: function(muted) {
          var self2 = this || Howler3;
          self2.ctx || setupAudioContext(), self2._muted = muted, self2.usingWebAudio && self2.masterGain.gain.setValueAtTime(muted ? 0 : self2._volume, Howler3.ctx.currentTime);
          for (var i = 0; i < self2._howls.length; i++)
            if (!self2._howls[i]._webAudio)
              for (var ids = self2._howls[i]._getSoundIds(), j = 0; j < ids.length; j++) {
                var sound = self2._howls[i]._soundById(ids[j]);
                sound && sound._node && (sound._node.muted = muted ? !0 : sound._muted);
              }
          return self2;
        },
        /**
         * Handle stopping all sounds globally.
         */
        stop: function() {
          for (var self2 = this || Howler3, i = 0; i < self2._howls.length; i++)
            self2._howls[i].stop();
          return self2;
        },
        /**
         * Unload and destroy all currently loaded Howl objects.
         * @return {Howler}
         */
        unload: function() {
          for (var self2 = this || Howler3, i = self2._howls.length - 1; i >= 0; i--)
            self2._howls[i].unload();
          return self2.usingWebAudio && self2.ctx && typeof self2.ctx.close < "u" && (self2.ctx.close(), self2.ctx = null, setupAudioContext()), self2;
        },
        /**
         * Check for codec support of specific extension.
         * @param  {String} ext Audio file extention.
         * @return {Boolean}
         */
        codecs: function(ext) {
          return (this || Howler3)._codecs[ext.replace(/^x-/, "")];
        },
        /**
         * Setup various state values for global tracking.
         * @return {Howler}
         */
        _setup: function() {
          var self2 = this || Howler3;
          if (self2.state = self2.ctx && self2.ctx.state || "suspended", self2._autoSuspend(), !self2.usingWebAudio)
            if (typeof Audio < "u")
              try {
                var test = new Audio();
                typeof test.oncanplaythrough > "u" && (self2._canPlayEvent = "canplay");
              } catch {
                self2.noAudio = !0;
              }
            else
              self2.noAudio = !0;
          try {
            var test = new Audio();
            test.muted && (self2.noAudio = !0);
          } catch {
          }
          return self2.noAudio || self2._setupCodecs(), self2;
        },
        /**
         * Check for browser support for various codecs and cache the results.
         * @return {Howler}
         */
        _setupCodecs: function() {
          var self2 = this || Howler3, audioTest = null;
          try {
            audioTest = typeof Audio < "u" ? new Audio() : null;
          } catch {
            return self2;
          }
          if (!audioTest || typeof audioTest.canPlayType != "function")
            return self2;
          var mpegTest = audioTest.canPlayType("audio/mpeg;").replace(/^no$/, ""), ua = self2._navigator ? self2._navigator.userAgent : "", checkOpera = ua.match(/OPR\/(\d+)/g), isOldOpera = checkOpera && parseInt(checkOpera[0].split("/")[1], 10) < 33, checkSafari = ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1, safariVersion = ua.match(/Version\/(.*?) /), isOldSafari = checkSafari && safariVersion && parseInt(safariVersion[1], 10) < 15;
          return self2._codecs = {
            mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType("audio/mp3;").replace(/^no$/, ""))),
            mpeg: !!mpegTest,
            opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
            ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
            wav: !!(audioTest.canPlayType('audio/wav; codecs="1"') || audioTest.canPlayType("audio/wav")).replace(/^no$/, ""),
            aac: !!audioTest.canPlayType("audio/aac;").replace(/^no$/, ""),
            caf: !!audioTest.canPlayType("audio/x-caf;").replace(/^no$/, ""),
            m4a: !!(audioTest.canPlayType("audio/x-m4a;") || audioTest.canPlayType("audio/m4a;") || audioTest.canPlayType("audio/aac;")).replace(/^no$/, ""),
            m4b: !!(audioTest.canPlayType("audio/x-m4b;") || audioTest.canPlayType("audio/m4b;") || audioTest.canPlayType("audio/aac;")).replace(/^no$/, ""),
            mp4: !!(audioTest.canPlayType("audio/x-mp4;") || audioTest.canPlayType("audio/mp4;") || audioTest.canPlayType("audio/aac;")).replace(/^no$/, ""),
            weba: !!(!isOldSafari && audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            webm: !!(!isOldSafari && audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, "")),
            dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ""),
            flac: !!(audioTest.canPlayType("audio/x-flac;") || audioTest.canPlayType("audio/flac;")).replace(/^no$/, "")
          }, self2;
        },
        /**
         * Some browsers/devices will only allow audio to be played after a user interaction.
         * Attempt to automatically unlock audio on the first user interaction.
         * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
         * @return {Howler}
         */
        _unlockAudio: function() {
          var self2 = this || Howler3;
          if (!(self2._audioUnlocked || !self2.ctx)) {
            self2._audioUnlocked = !1, self2.autoUnlock = !1, !self2._mobileUnloaded && self2.ctx.sampleRate !== 44100 && (self2._mobileUnloaded = !0, self2.unload()), self2._scratchBuffer = self2.ctx.createBuffer(1, 1, 22050);
            var unlock = function(e) {
              for (; self2._html5AudioPool.length < self2.html5PoolSize; )
                try {
                  var audioNode = new Audio();
                  audioNode._unlocked = !0, self2._releaseHtml5Audio(audioNode);
                } catch {
                  self2.noAudio = !0;
                  break;
                }
              for (var i = 0; i < self2._howls.length; i++)
                if (!self2._howls[i]._webAudio)
                  for (var ids = self2._howls[i]._getSoundIds(), j = 0; j < ids.length; j++) {
                    var sound = self2._howls[i]._soundById(ids[j]);
                    sound && sound._node && !sound._node._unlocked && (sound._node._unlocked = !0, sound._node.load());
                  }
              self2._autoResume();
              var source = self2.ctx.createBufferSource();
              source.buffer = self2._scratchBuffer, source.connect(self2.ctx.destination), typeof source.start > "u" ? source.noteOn(0) : source.start(0), typeof self2.ctx.resume == "function" && self2.ctx.resume(), source.onended = function() {
                source.disconnect(0), self2._audioUnlocked = !0, document.removeEventListener("touchstart", unlock, !0), document.removeEventListener("touchend", unlock, !0), document.removeEventListener("click", unlock, !0), document.removeEventListener("keydown", unlock, !0);
                for (var i2 = 0; i2 < self2._howls.length; i2++)
                  self2._howls[i2]._emit("unlock");
              };
            };
            return document.addEventListener("touchstart", unlock, !0), document.addEventListener("touchend", unlock, !0), document.addEventListener("click", unlock, !0), document.addEventListener("keydown", unlock, !0), self2;
          }
        },
        /**
         * Get an unlocked HTML5 Audio object from the pool. If none are left,
         * return a new Audio object and throw a warning.
         * @return {Audio} HTML5 Audio object.
         */
        _obtainHtml5Audio: function() {
          var self2 = this || Howler3;
          if (self2._html5AudioPool.length)
            return self2._html5AudioPool.pop();
          var testPlay = new Audio().play();
          return testPlay && typeof Promise < "u" && (testPlay instanceof Promise || typeof testPlay.then == "function") && testPlay.catch(function() {
            console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.");
          }), new Audio();
        },
        /**
         * Return an activated HTML5 Audio object to the pool.
         * @return {Howler}
         */
        _releaseHtml5Audio: function(audio) {
          var self2 = this || Howler3;
          return audio._unlocked && self2._html5AudioPool.push(audio), self2;
        },
        /**
         * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
         * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
         * @return {Howler}
         */
        _autoSuspend: function() {
          var self2 = this;
          if (!(!self2.autoSuspend || !self2.ctx || typeof self2.ctx.suspend > "u" || !Howler3.usingWebAudio)) {
            for (var i = 0; i < self2._howls.length; i++)
              if (self2._howls[i]._webAudio) {
                for (var j = 0; j < self2._howls[i]._sounds.length; j++)
                  if (!self2._howls[i]._sounds[j]._paused)
                    return self2;
              }
            return self2._suspendTimer && clearTimeout(self2._suspendTimer), self2._suspendTimer = setTimeout(function() {
              if (self2.autoSuspend) {
                self2._suspendTimer = null, self2.state = "suspending";
                var handleSuspension = function() {
                  self2.state = "suspended", self2._resumeAfterSuspend && (delete self2._resumeAfterSuspend, self2._autoResume());
                };
                self2.ctx.suspend().then(handleSuspension, handleSuspension);
              }
            }, 3e4), self2;
          }
        },
        /**
         * Automatically resume the Web Audio AudioContext when a new sound is played.
         * @return {Howler}
         */
        _autoResume: function() {
          var self2 = this;
          if (!(!self2.ctx || typeof self2.ctx.resume > "u" || !Howler3.usingWebAudio))
            return self2.state === "running" && self2.ctx.state !== "interrupted" && self2._suspendTimer ? (clearTimeout(self2._suspendTimer), self2._suspendTimer = null) : self2.state === "suspended" || self2.state === "running" && self2.ctx.state === "interrupted" ? (self2.ctx.resume().then(function() {
              self2.state = "running";
              for (var i = 0; i < self2._howls.length; i++)
                self2._howls[i]._emit("resume");
            }), self2._suspendTimer && (clearTimeout(self2._suspendTimer), self2._suspendTimer = null)) : self2.state === "suspending" && (self2._resumeAfterSuspend = !0), self2;
        }
      };
      var Howler3 = new HowlerGlobal2(), Howl3 = function(o) {
        var self2 = this;
        if (!o.src || o.src.length === 0) {
          console.error("An array of source files must be passed with any new Howl.");
          return;
        }
        self2.init(o);
      };
      Howl3.prototype = {
        /**
         * Initialize a new Howl group object.
         * @param  {Object} o Passed in properties for this group.
         * @return {Howl}
         */
        init: function(o) {
          var self2 = this;
          return Howler3.ctx || setupAudioContext(), self2._autoplay = o.autoplay || !1, self2._format = typeof o.format != "string" ? o.format : [o.format], self2._html5 = o.html5 || !1, self2._muted = o.mute || !1, self2._loop = o.loop || !1, self2._pool = o.pool || 5, self2._preload = typeof o.preload == "boolean" || o.preload === "metadata" ? o.preload : !0, self2._rate = o.rate || 1, self2._sprite = o.sprite || {}, self2._src = typeof o.src != "string" ? o.src : [o.src], self2._volume = o.volume !== void 0 ? o.volume : 1, self2._xhr = {
            method: o.xhr && o.xhr.method ? o.xhr.method : "GET",
            headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
            withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : !1
          }, self2._duration = 0, self2._state = "unloaded", self2._sounds = [], self2._endTimers = {}, self2._queue = [], self2._playLock = !1, self2._onend = o.onend ? [{ fn: o.onend }] : [], self2._onfade = o.onfade ? [{ fn: o.onfade }] : [], self2._onload = o.onload ? [{ fn: o.onload }] : [], self2._onloaderror = o.onloaderror ? [{ fn: o.onloaderror }] : [], self2._onplayerror = o.onplayerror ? [{ fn: o.onplayerror }] : [], self2._onpause = o.onpause ? [{ fn: o.onpause }] : [], self2._onplay = o.onplay ? [{ fn: o.onplay }] : [], self2._onstop = o.onstop ? [{ fn: o.onstop }] : [], self2._onmute = o.onmute ? [{ fn: o.onmute }] : [], self2._onvolume = o.onvolume ? [{ fn: o.onvolume }] : [], self2._onrate = o.onrate ? [{ fn: o.onrate }] : [], self2._onseek = o.onseek ? [{ fn: o.onseek }] : [], self2._onunlock = o.onunlock ? [{ fn: o.onunlock }] : [], self2._onresume = [], self2._webAudio = Howler3.usingWebAudio && !self2._html5, typeof Howler3.ctx < "u" && Howler3.ctx && Howler3.autoUnlock && Howler3._unlockAudio(), Howler3._howls.push(self2), self2._autoplay && self2._queue.push({
            event: "play",
            action: function() {
              self2.play();
            }
          }), self2._preload && self2._preload !== "none" && self2.load(), self2;
        },
        /**
         * Load the audio file.
         * @return {Howler}
         */
        load: function() {
          var self2 = this, url = null;
          if (Howler3.noAudio) {
            self2._emit("loaderror", null, "No audio support.");
            return;
          }
          typeof self2._src == "string" && (self2._src = [self2._src]);
          for (var i = 0; i < self2._src.length; i++) {
            var ext, str;
            if (self2._format && self2._format[i])
              ext = self2._format[i];
            else {
              if (str = self2._src[i], typeof str != "string") {
                self2._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                continue;
              }
              ext = /^data:audio\/([^;,]+);/i.exec(str), ext || (ext = /\.([^.]+)$/.exec(str.split("?", 1)[0])), ext && (ext = ext[1].toLowerCase());
            }
            if (ext || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), ext && Howler3.codecs(ext)) {
              url = self2._src[i];
              break;
            }
          }
          if (!url) {
            self2._emit("loaderror", null, "No codec support for selected audio sources.");
            return;
          }
          return self2._src = url, self2._state = "loading", window.location.protocol === "https:" && url.slice(0, 5) === "http:" && (self2._html5 = !0, self2._webAudio = !1), new Sound2(self2), self2._webAudio && loadBuffer(self2), self2;
        },
        /**
         * Play a sound or resume previous playback.
         * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Number}          Sound ID.
         */
        play: function(sprite, internal) {
          var self2 = this, id = null;
          if (typeof sprite == "number")
            id = sprite, sprite = null;
          else {
            if (typeof sprite == "string" && self2._state === "loaded" && !self2._sprite[sprite])
              return null;
            if (typeof sprite > "u" && (sprite = "__default", !self2._playLock)) {
              for (var num = 0, i = 0; i < self2._sounds.length; i++)
                self2._sounds[i]._paused && !self2._sounds[i]._ended && (num++, id = self2._sounds[i]._id);
              num === 1 ? sprite = null : id = null;
            }
          }
          var sound = id ? self2._soundById(id) : self2._inactiveSound();
          if (!sound)
            return null;
          if (id && !sprite && (sprite = sound._sprite || "__default"), self2._state !== "loaded") {
            sound._sprite = sprite, sound._ended = !1;
            var soundId = sound._id;
            return self2._queue.push({
              event: "play",
              action: function() {
                self2.play(soundId);
              }
            }), soundId;
          }
          if (id && !sound._paused)
            return internal || self2._loadQueue("play"), sound._id;
          self2._webAudio && Howler3._autoResume();
          var seek = Math.max(0, sound._seek > 0 ? sound._seek : self2._sprite[sprite][0] / 1e3), duration = Math.max(0, (self2._sprite[sprite][0] + self2._sprite[sprite][1]) / 1e3 - seek), timeout = duration * 1e3 / Math.abs(sound._rate), start = self2._sprite[sprite][0] / 1e3, stop2 = (self2._sprite[sprite][0] + self2._sprite[sprite][1]) / 1e3;
          sound._sprite = sprite, sound._ended = !1;
          var setParams = function() {
            sound._paused = !1, sound._seek = seek, sound._start = start, sound._stop = stop2, sound._loop = !!(sound._loop || self2._sprite[sprite][2]);
          };
          if (seek >= stop2) {
            self2._ended(sound);
            return;
          }
          var node = sound._node;
          if (self2._webAudio) {
            var playWebAudio = function() {
              self2._playLock = !1, setParams(), self2._refreshBuffer(sound);
              var vol = sound._muted || self2._muted ? 0 : sound._volume;
              node.gain.setValueAtTime(vol, Howler3.ctx.currentTime), sound._playStart = Howler3.ctx.currentTime, typeof node.bufferSource.start > "u" ? sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration) : sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration), timeout !== 1 / 0 && (self2._endTimers[sound._id] = setTimeout(self2._ended.bind(self2, sound), timeout)), internal || setTimeout(function() {
                self2._emit("play", sound._id), self2._loadQueue();
              }, 0);
            };
            Howler3.state === "running" && Howler3.ctx.state !== "interrupted" ? playWebAudio() : (self2._playLock = !0, self2.once("resume", playWebAudio), self2._clearTimer(sound._id));
          } else {
            var playHtml5 = function() {
              node.currentTime = seek, node.muted = sound._muted || self2._muted || Howler3._muted || node.muted, node.volume = sound._volume * Howler3.volume(), node.playbackRate = sound._rate;
              try {
                var play = node.play();
                if (play && typeof Promise < "u" && (play instanceof Promise || typeof play.then == "function") ? (self2._playLock = !0, setParams(), play.then(function() {
                  self2._playLock = !1, node._unlocked = !0, internal ? self2._loadQueue() : self2._emit("play", sound._id);
                }).catch(function() {
                  self2._playLock = !1, self2._emit("playerror", sound._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."), sound._ended = !0, sound._paused = !0;
                })) : internal || (self2._playLock = !1, setParams(), self2._emit("play", sound._id)), node.playbackRate = sound._rate, node.paused) {
                  self2._emit("playerror", sound._id, "Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");
                  return;
                }
                sprite !== "__default" || sound._loop ? self2._endTimers[sound._id] = setTimeout(self2._ended.bind(self2, sound), timeout) : (self2._endTimers[sound._id] = function() {
                  self2._ended(sound), node.removeEventListener("ended", self2._endTimers[sound._id], !1);
                }, node.addEventListener("ended", self2._endTimers[sound._id], !1));
              } catch (err) {
                self2._emit("playerror", sound._id, err);
              }
            };
            node.src === "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" && (node.src = self2._src, node.load());
            var loadedNoReadyState = window && window.ejecta || !node.readyState && Howler3._navigator.isCocoonJS;
            if (node.readyState >= 3 || loadedNoReadyState)
              playHtml5();
            else {
              self2._playLock = !0, self2._state = "loading";
              var listener = function() {
                self2._state = "loaded", playHtml5(), node.removeEventListener(Howler3._canPlayEvent, listener, !1);
              };
              node.addEventListener(Howler3._canPlayEvent, listener, !1), self2._clearTimer(sound._id);
            }
          }
          return sound._id;
        },
        /**
         * Pause playback and save current position.
         * @param  {Number} id The sound ID (empty to pause all in group).
         * @return {Howl}
         */
        pause: function(id) {
          var self2 = this;
          if (self2._state !== "loaded" || self2._playLock)
            return self2._queue.push({
              event: "pause",
              action: function() {
                self2.pause(id);
              }
            }), self2;
          for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
            self2._clearTimer(ids[i]);
            var sound = self2._soundById(ids[i]);
            if (sound && !sound._paused && (sound._seek = self2.seek(ids[i]), sound._rateSeek = 0, sound._paused = !0, self2._stopFade(ids[i]), sound._node))
              if (self2._webAudio) {
                if (!sound._node.bufferSource)
                  continue;
                typeof sound._node.bufferSource.stop > "u" ? sound._node.bufferSource.noteOff(0) : sound._node.bufferSource.stop(0), self2._cleanBuffer(sound._node);
              } else (!isNaN(sound._node.duration) || sound._node.duration === 1 / 0) && sound._node.pause();
            arguments[1] || self2._emit("pause", sound ? sound._id : null);
          }
          return self2;
        },
        /**
         * Stop playback and reset to start.
         * @param  {Number} id The sound ID (empty to stop all in group).
         * @param  {Boolean} internal Internal Use: true prevents event firing.
         * @return {Howl}
         */
        stop: function(id, internal) {
          var self2 = this;
          if (self2._state !== "loaded" || self2._playLock)
            return self2._queue.push({
              event: "stop",
              action: function() {
                self2.stop(id);
              }
            }), self2;
          for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
            self2._clearTimer(ids[i]);
            var sound = self2._soundById(ids[i]);
            sound && (sound._seek = sound._start || 0, sound._rateSeek = 0, sound._paused = !0, sound._ended = !0, self2._stopFade(ids[i]), sound._node && (self2._webAudio ? sound._node.bufferSource && (typeof sound._node.bufferSource.stop > "u" ? sound._node.bufferSource.noteOff(0) : sound._node.bufferSource.stop(0), self2._cleanBuffer(sound._node)) : (!isNaN(sound._node.duration) || sound._node.duration === 1 / 0) && (sound._node.currentTime = sound._start || 0, sound._node.pause(), sound._node.duration === 1 / 0 && self2._clearSound(sound._node))), internal || self2._emit("stop", sound._id));
          }
          return self2;
        },
        /**
         * Mute/unmute a single sound or all sounds in this Howl group.
         * @param  {Boolean} muted Set to true to mute and false to unmute.
         * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
         * @return {Howl}
         */
        mute: function(muted, id) {
          var self2 = this;
          if (self2._state !== "loaded" || self2._playLock)
            return self2._queue.push({
              event: "mute",
              action: function() {
                self2.mute(muted, id);
              }
            }), self2;
          if (typeof id > "u")
            if (typeof muted == "boolean")
              self2._muted = muted;
            else
              return self2._muted;
          for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
            var sound = self2._soundById(ids[i]);
            sound && (sound._muted = muted, sound._interval && self2._stopFade(sound._id), self2._webAudio && sound._node ? sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler3.ctx.currentTime) : sound._node && (sound._node.muted = Howler3._muted ? !0 : muted), self2._emit("mute", sound._id));
          }
          return self2;
        },
        /**
         * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
         *   volume() -> Returns the group's volume value.
         *   volume(id) -> Returns the sound id's current volume.
         *   volume(vol) -> Sets the volume of all sounds in this Howl group.
         *   volume(vol, id) -> Sets the volume of passed sound id.
         * @return {Howl/Number} Returns self or current volume.
         */
        volume: function() {
          var self2 = this, args = arguments, vol, id;
          if (args.length === 0)
            return self2._volume;
          if (args.length === 1 || args.length === 2 && typeof args[1] > "u") {
            var ids = self2._getSoundIds(), index = ids.indexOf(args[0]);
            index >= 0 ? id = parseInt(args[0], 10) : vol = parseFloat(args[0]);
          } else args.length >= 2 && (vol = parseFloat(args[0]), id = parseInt(args[1], 10));
          var sound;
          if (typeof vol < "u" && vol >= 0 && vol <= 1) {
            if (self2._state !== "loaded" || self2._playLock)
              return self2._queue.push({
                event: "volume",
                action: function() {
                  self2.volume.apply(self2, args);
                }
              }), self2;
            typeof id > "u" && (self2._volume = vol), id = self2._getSoundIds(id);
            for (var i = 0; i < id.length; i++)
              sound = self2._soundById(id[i]), sound && (sound._volume = vol, args[2] || self2._stopFade(id[i]), self2._webAudio && sound._node && !sound._muted ? sound._node.gain.setValueAtTime(vol, Howler3.ctx.currentTime) : sound._node && !sound._muted && (sound._node.volume = vol * Howler3.volume()), self2._emit("volume", sound._id));
          } else
            return sound = id ? self2._soundById(id) : self2._sounds[0], sound ? sound._volume : 0;
          return self2;
        },
        /**
         * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id (omit to fade all sounds).
         * @return {Howl}
         */
        fade: function(from, to, len, id) {
          var self2 = this;
          if (self2._state !== "loaded" || self2._playLock)
            return self2._queue.push({
              event: "fade",
              action: function() {
                self2.fade(from, to, len, id);
              }
            }), self2;
          from = Math.min(Math.max(0, parseFloat(from)), 1), to = Math.min(Math.max(0, parseFloat(to)), 1), len = parseFloat(len), self2.volume(from, id);
          for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
            var sound = self2._soundById(ids[i]);
            if (sound) {
              if (id || self2._stopFade(ids[i]), self2._webAudio && !sound._muted) {
                var currentTime = Howler3.ctx.currentTime, end = currentTime + len / 1e3;
                sound._volume = from, sound._node.gain.setValueAtTime(from, currentTime), sound._node.gain.linearRampToValueAtTime(to, end);
              }
              self2._startFadeInterval(sound, from, to, len, ids[i], typeof id > "u");
            }
          }
          return self2;
        },
        /**
         * Starts the internal interval to fade a sound.
         * @param  {Object} sound Reference to sound to fade.
         * @param  {Number} from The value to fade from (0.0 to 1.0).
         * @param  {Number} to   The volume to fade to (0.0 to 1.0).
         * @param  {Number} len  Time in milliseconds to fade.
         * @param  {Number} id   The sound id to fade.
         * @param  {Boolean} isGroup   If true, set the volume on the group.
         */
        _startFadeInterval: function(sound, from, to, len, id, isGroup) {
          var self2 = this, vol = from, diff = to - from, steps = Math.abs(diff / 0.01), stepLen = Math.max(4, steps > 0 ? len / steps : len), lastTick = Date.now();
          sound._fadeTo = to, sound._interval = setInterval(function() {
            var tick = (Date.now() - lastTick) / len;
            lastTick = Date.now(), vol += diff * tick, vol = Math.round(vol * 100) / 100, diff < 0 ? vol = Math.max(to, vol) : vol = Math.min(to, vol), self2._webAudio ? sound._volume = vol : self2.volume(vol, sound._id, !0), isGroup && (self2._volume = vol), (to < from && vol <= to || to > from && vol >= to) && (clearInterval(sound._interval), sound._interval = null, sound._fadeTo = null, self2.volume(to, sound._id), self2._emit("fade", sound._id));
          }, stepLen);
        },
        /**
         * Internal method that stops the currently playing fade when
         * a new fade starts, volume is changed or the sound is stopped.
         * @param  {Number} id The sound id.
         * @return {Howl}
         */
        _stopFade: function(id) {
          var self2 = this, sound = self2._soundById(id);
          return sound && sound._interval && (self2._webAudio && sound._node.gain.cancelScheduledValues(Howler3.ctx.currentTime), clearInterval(sound._interval), sound._interval = null, self2.volume(sound._fadeTo, id), sound._fadeTo = null, self2._emit("fade", id)), self2;
        },
        /**
         * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
         *   loop() -> Returns the group's loop value.
         *   loop(id) -> Returns the sound id's loop value.
         *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
         *   loop(loop, id) -> Sets the loop value of passed sound id.
         * @return {Howl/Boolean} Returns self or current loop value.
         */
        loop: function() {
          var self2 = this, args = arguments, loop, id, sound;
          if (args.length === 0)
            return self2._loop;
          if (args.length === 1)
            if (typeof args[0] == "boolean")
              loop = args[0], self2._loop = loop;
            else
              return sound = self2._soundById(parseInt(args[0], 10)), sound ? sound._loop : !1;
          else args.length === 2 && (loop = args[0], id = parseInt(args[1], 10));
          for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++)
            sound = self2._soundById(ids[i]), sound && (sound._loop = loop, self2._webAudio && sound._node && sound._node.bufferSource && (sound._node.bufferSource.loop = loop, loop && (sound._node.bufferSource.loopStart = sound._start || 0, sound._node.bufferSource.loopEnd = sound._stop, self2.playing(ids[i]) && (self2.pause(ids[i], !0), self2.play(ids[i], !0)))));
          return self2;
        },
        /**
         * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   rate() -> Returns the first sound node's current playback rate.
         *   rate(id) -> Returns the sound id's current playback rate.
         *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
         *   rate(rate, id) -> Sets the playback rate of passed sound id.
         * @return {Howl/Number} Returns self or the current playback rate.
         */
        rate: function() {
          var self2 = this, args = arguments, rate, id;
          if (args.length === 0)
            id = self2._sounds[0]._id;
          else if (args.length === 1) {
            var ids = self2._getSoundIds(), index = ids.indexOf(args[0]);
            index >= 0 ? id = parseInt(args[0], 10) : rate = parseFloat(args[0]);
          } else args.length === 2 && (rate = parseFloat(args[0]), id = parseInt(args[1], 10));
          var sound;
          if (typeof rate == "number") {
            if (self2._state !== "loaded" || self2._playLock)
              return self2._queue.push({
                event: "rate",
                action: function() {
                  self2.rate.apply(self2, args);
                }
              }), self2;
            typeof id > "u" && (self2._rate = rate), id = self2._getSoundIds(id);
            for (var i = 0; i < id.length; i++)
              if (sound = self2._soundById(id[i]), sound) {
                self2.playing(id[i]) && (sound._rateSeek = self2.seek(id[i]), sound._playStart = self2._webAudio ? Howler3.ctx.currentTime : sound._playStart), sound._rate = rate, self2._webAudio && sound._node && sound._node.bufferSource ? sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler3.ctx.currentTime) : sound._node && (sound._node.playbackRate = rate);
                var seek = self2.seek(id[i]), duration = (self2._sprite[sound._sprite][0] + self2._sprite[sound._sprite][1]) / 1e3 - seek, timeout = duration * 1e3 / Math.abs(sound._rate);
                (self2._endTimers[id[i]] || !sound._paused) && (self2._clearTimer(id[i]), self2._endTimers[id[i]] = setTimeout(self2._ended.bind(self2, sound), timeout)), self2._emit("rate", sound._id);
              }
          } else
            return sound = self2._soundById(id), sound ? sound._rate : self2._rate;
          return self2;
        },
        /**
         * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
         *   seek() -> Returns the first sound node's current seek position.
         *   seek(id) -> Returns the sound id's current seek position.
         *   seek(seek) -> Sets the seek position of the first sound node.
         *   seek(seek, id) -> Sets the seek position of passed sound id.
         * @return {Howl/Number} Returns self or the current seek position.
         */
        seek: function() {
          var self2 = this, args = arguments, seek, id;
          if (args.length === 0)
            self2._sounds.length && (id = self2._sounds[0]._id);
          else if (args.length === 1) {
            var ids = self2._getSoundIds(), index = ids.indexOf(args[0]);
            index >= 0 ? id = parseInt(args[0], 10) : self2._sounds.length && (id = self2._sounds[0]._id, seek = parseFloat(args[0]));
          } else args.length === 2 && (seek = parseFloat(args[0]), id = parseInt(args[1], 10));
          if (typeof id > "u")
            return 0;
          if (typeof seek == "number" && (self2._state !== "loaded" || self2._playLock))
            return self2._queue.push({
              event: "seek",
              action: function() {
                self2.seek.apply(self2, args);
              }
            }), self2;
          var sound = self2._soundById(id);
          if (sound)
            if (typeof seek == "number" && seek >= 0) {
              var playing = self2.playing(id);
              playing && self2.pause(id, !0), sound._seek = seek, sound._ended = !1, self2._clearTimer(id), !self2._webAudio && sound._node && !isNaN(sound._node.duration) && (sound._node.currentTime = seek);
              var seekAndEmit = function() {
                playing && self2.play(id, !0), self2._emit("seek", id);
              };
              if (playing && !self2._webAudio) {
                var emitSeek = function() {
                  self2._playLock ? setTimeout(emitSeek, 0) : seekAndEmit();
                };
                setTimeout(emitSeek, 0);
              } else
                seekAndEmit();
            } else if (self2._webAudio) {
              var realTime = self2.playing(id) ? Howler3.ctx.currentTime - sound._playStart : 0, rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
              return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
            } else
              return sound._node.currentTime;
          return self2;
        },
        /**
         * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
         * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
         * @return {Boolean} True if playing and false if not.
         */
        playing: function(id) {
          var self2 = this;
          if (typeof id == "number") {
            var sound = self2._soundById(id);
            return sound ? !sound._paused : !1;
          }
          for (var i = 0; i < self2._sounds.length; i++)
            if (!self2._sounds[i]._paused)
              return !0;
          return !1;
        },
        /**
         * Get the duration of this sound. Passing a sound id will return the sprite duration.
         * @param  {Number} id The sound id to check. If none is passed, return full source duration.
         * @return {Number} Audio duration in seconds.
         */
        duration: function(id) {
          var self2 = this, duration = self2._duration, sound = self2._soundById(id);
          return sound && (duration = self2._sprite[sound._sprite][1] / 1e3), duration;
        },
        /**
         * Returns the current loaded state of this Howl.
         * @return {String} 'unloaded', 'loading', 'loaded'
         */
        state: function() {
          return this._state;
        },
        /**
         * Unload and destroy the current Howl object.
         * This will immediately stop all sound instances attached to this group.
         */
        unload: function() {
          for (var self2 = this, sounds = self2._sounds, i = 0; i < sounds.length; i++)
            sounds[i]._paused || self2.stop(sounds[i]._id), self2._webAudio || (self2._clearSound(sounds[i]._node), sounds[i]._node.removeEventListener("error", sounds[i]._errorFn, !1), sounds[i]._node.removeEventListener(Howler3._canPlayEvent, sounds[i]._loadFn, !1), sounds[i]._node.removeEventListener("ended", sounds[i]._endFn, !1), Howler3._releaseHtml5Audio(sounds[i]._node)), delete sounds[i]._node, self2._clearTimer(sounds[i]._id);
          var index = Howler3._howls.indexOf(self2);
          index >= 0 && Howler3._howls.splice(index, 1);
          var remCache = !0;
          for (i = 0; i < Howler3._howls.length; i++)
            if (Howler3._howls[i]._src === self2._src || self2._src.indexOf(Howler3._howls[i]._src) >= 0) {
              remCache = !1;
              break;
            }
          return cache && remCache && delete cache[self2._src], Howler3.noAudio = !1, self2._state = "unloaded", self2._sounds = [], self2 = null, null;
        },
        /**
         * Listen to a custom event.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
         * @return {Howl}
         */
        on: function(event, fn, id, once) {
          var self2 = this, events = self2["_on" + event];
          return typeof fn == "function" && events.push(once ? { id, fn, once } : { id, fn }), self2;
        },
        /**
         * Remove a custom event. Call without parameters to remove all events.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to remove. Leave empty to remove all.
         * @param  {Number}   id    (optional) Only remove events for this sound.
         * @return {Howl}
         */
        off: function(event, fn, id) {
          var self2 = this, events = self2["_on" + event], i = 0;
          if (typeof fn == "number" && (id = fn, fn = null), fn || id)
            for (i = 0; i < events.length; i++) {
              var isId = id === events[i].id;
              if (fn === events[i].fn && isId || !fn && isId) {
                events.splice(i, 1);
                break;
              }
            }
          else if (event)
            self2["_on" + event] = [];
          else {
            var keys = Object.keys(self2);
            for (i = 0; i < keys.length; i++)
              keys[i].indexOf("_on") === 0 && Array.isArray(self2[keys[i]]) && (self2[keys[i]] = []);
          }
          return self2;
        },
        /**
         * Listen to a custom event and remove it once fired.
         * @param  {String}   event Event name.
         * @param  {Function} fn    Listener to call.
         * @param  {Number}   id    (optional) Only listen to events for this sound.
         * @return {Howl}
         */
        once: function(event, fn, id) {
          var self2 = this;
          return self2.on(event, fn, id, 1), self2;
        },
        /**
         * Emit all events of a specific type and pass the sound id.
         * @param  {String} event Event name.
         * @param  {Number} id    Sound ID.
         * @param  {Number} msg   Message to go with event.
         * @return {Howl}
         */
        _emit: function(event, id, msg) {
          for (var self2 = this, events = self2["_on" + event], i = events.length - 1; i >= 0; i--)
            (!events[i].id || events[i].id === id || event === "load") && (setTimeout(function(fn) {
              fn.call(this, id, msg);
            }.bind(self2, events[i].fn), 0), events[i].once && self2.off(event, events[i].fn, events[i].id));
          return self2._loadQueue(event), self2;
        },
        /**
         * Queue of actions initiated before the sound has loaded.
         * These will be called in sequence, with the next only firing
         * after the previous has finished executing (even if async like play).
         * @return {Howl}
         */
        _loadQueue: function(event) {
          var self2 = this;
          if (self2._queue.length > 0) {
            var task = self2._queue[0];
            task.event === event && (self2._queue.shift(), self2._loadQueue()), event || task.action();
          }
          return self2;
        },
        /**
         * Fired when playback ends at the end of the duration.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _ended: function(sound) {
          var self2 = this, sprite = sound._sprite;
          if (!self2._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop)
            return setTimeout(self2._ended.bind(self2, sound), 100), self2;
          var loop = !!(sound._loop || self2._sprite[sprite][2]);
          if (self2._emit("end", sound._id), !self2._webAudio && loop && self2.stop(sound._id, !0).play(sound._id), self2._webAudio && loop) {
            self2._emit("play", sound._id), sound._seek = sound._start || 0, sound._rateSeek = 0, sound._playStart = Howler3.ctx.currentTime;
            var timeout = (sound._stop - sound._start) * 1e3 / Math.abs(sound._rate);
            self2._endTimers[sound._id] = setTimeout(self2._ended.bind(self2, sound), timeout);
          }
          return self2._webAudio && !loop && (sound._paused = !0, sound._ended = !0, sound._seek = sound._start || 0, sound._rateSeek = 0, self2._clearTimer(sound._id), self2._cleanBuffer(sound._node), Howler3._autoSuspend()), !self2._webAudio && !loop && self2.stop(sound._id, !0), self2;
        },
        /**
         * Clear the end timer for a sound playback.
         * @param  {Number} id The sound ID.
         * @return {Howl}
         */
        _clearTimer: function(id) {
          var self2 = this;
          if (self2._endTimers[id]) {
            if (typeof self2._endTimers[id] != "function")
              clearTimeout(self2._endTimers[id]);
            else {
              var sound = self2._soundById(id);
              sound && sound._node && sound._node.removeEventListener("ended", self2._endTimers[id], !1);
            }
            delete self2._endTimers[id];
          }
          return self2;
        },
        /**
         * Return the sound identified by this ID, or return null.
         * @param  {Number} id Sound ID
         * @return {Object}    Sound object or null.
         */
        _soundById: function(id) {
          for (var self2 = this, i = 0; i < self2._sounds.length; i++)
            if (id === self2._sounds[i]._id)
              return self2._sounds[i];
          return null;
        },
        /**
         * Return an inactive sound from the pool or create a new one.
         * @return {Sound} Sound playback object.
         */
        _inactiveSound: function() {
          var self2 = this;
          self2._drain();
          for (var i = 0; i < self2._sounds.length; i++)
            if (self2._sounds[i]._ended)
              return self2._sounds[i].reset();
          return new Sound2(self2);
        },
        /**
         * Drain excess inactive sounds from the pool.
         */
        _drain: function() {
          var self2 = this, limit = self2._pool, cnt = 0, i = 0;
          if (!(self2._sounds.length < limit)) {
            for (i = 0; i < self2._sounds.length; i++)
              self2._sounds[i]._ended && cnt++;
            for (i = self2._sounds.length - 1; i >= 0; i--) {
              if (cnt <= limit)
                return;
              self2._sounds[i]._ended && (self2._webAudio && self2._sounds[i]._node && self2._sounds[i]._node.disconnect(0), self2._sounds.splice(i, 1), cnt--);
            }
          }
        },
        /**
         * Get all ID's from the sounds pool.
         * @param  {Number} id Only return one ID if one is passed.
         * @return {Array}    Array of IDs.
         */
        _getSoundIds: function(id) {
          var self2 = this;
          if (typeof id > "u") {
            for (var ids = [], i = 0; i < self2._sounds.length; i++)
              ids.push(self2._sounds[i]._id);
            return ids;
          } else
            return [id];
        },
        /**
         * Load the sound back into the buffer source.
         * @param  {Sound} sound The sound object to work with.
         * @return {Howl}
         */
        _refreshBuffer: function(sound) {
          var self2 = this;
          return sound._node.bufferSource = Howler3.ctx.createBufferSource(), sound._node.bufferSource.buffer = cache[self2._src], sound._panner ? sound._node.bufferSource.connect(sound._panner) : sound._node.bufferSource.connect(sound._node), sound._node.bufferSource.loop = sound._loop, sound._loop && (sound._node.bufferSource.loopStart = sound._start || 0, sound._node.bufferSource.loopEnd = sound._stop || 0), sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler3.ctx.currentTime), self2;
        },
        /**
         * Prevent memory leaks by cleaning up the buffer source after playback.
         * @param  {Object} node Sound's audio node containing the buffer source.
         * @return {Howl}
         */
        _cleanBuffer: function(node) {
          var self2 = this, isIOS = Howler3._navigator && Howler3._navigator.vendor.indexOf("Apple") >= 0;
          if (!node.bufferSource)
            return self2;
          if (Howler3._scratchBuffer && node.bufferSource && (node.bufferSource.onended = null, node.bufferSource.disconnect(0), isIOS))
            try {
              node.bufferSource.buffer = Howler3._scratchBuffer;
            } catch {
            }
          return node.bufferSource = null, self2;
        },
        /**
         * Set the source to a 0-second silence to stop any downloading (except in IE).
         * @param  {Object} node Audio node to clear.
         */
        _clearSound: function(node) {
          var checkIE = /MSIE |Trident\//.test(Howler3._navigator && Howler3._navigator.userAgent);
          checkIE || (node.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        }
      };
      var Sound2 = function(howl) {
        this._parent = howl, this.init();
      };
      Sound2.prototype = {
        /**
         * Initialize a new Sound object.
         * @return {Sound}
         */
        init: function() {
          var self2 = this, parent = self2._parent;
          return self2._muted = parent._muted, self2._loop = parent._loop, self2._volume = parent._volume, self2._rate = parent._rate, self2._seek = 0, self2._paused = !0, self2._ended = !0, self2._sprite = "__default", self2._id = ++Howler3._counter, parent._sounds.push(self2), self2.create(), self2;
        },
        /**
         * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
         * @return {Sound}
         */
        create: function() {
          var self2 = this, parent = self2._parent, volume = Howler3._muted || self2._muted || self2._parent._muted ? 0 : self2._volume;
          return parent._webAudio ? (self2._node = typeof Howler3.ctx.createGain > "u" ? Howler3.ctx.createGainNode() : Howler3.ctx.createGain(), self2._node.gain.setValueAtTime(volume, Howler3.ctx.currentTime), self2._node.paused = !0, self2._node.connect(Howler3.masterGain)) : Howler3.noAudio || (self2._node = Howler3._obtainHtml5Audio(), self2._errorFn = self2._errorListener.bind(self2), self2._node.addEventListener("error", self2._errorFn, !1), self2._loadFn = self2._loadListener.bind(self2), self2._node.addEventListener(Howler3._canPlayEvent, self2._loadFn, !1), self2._endFn = self2._endListener.bind(self2), self2._node.addEventListener("ended", self2._endFn, !1), self2._node.src = parent._src, self2._node.preload = parent._preload === !0 ? "auto" : parent._preload, self2._node.volume = volume * Howler3.volume(), self2._node.load()), self2;
        },
        /**
         * Reset the parameters of this sound to the original state (for recycle).
         * @return {Sound}
         */
        reset: function() {
          var self2 = this, parent = self2._parent;
          return self2._muted = parent._muted, self2._loop = parent._loop, self2._volume = parent._volume, self2._rate = parent._rate, self2._seek = 0, self2._rateSeek = 0, self2._paused = !0, self2._ended = !0, self2._sprite = "__default", self2._id = ++Howler3._counter, self2;
        },
        /**
         * HTML5 Audio error listener callback.
         */
        _errorListener: function() {
          var self2 = this;
          self2._parent._emit("loaderror", self2._id, self2._node.error ? self2._node.error.code : 0), self2._node.removeEventListener("error", self2._errorFn, !1);
        },
        /**
         * HTML5 Audio canplaythrough listener callback.
         */
        _loadListener: function() {
          var self2 = this, parent = self2._parent;
          parent._duration = Math.ceil(self2._node.duration * 10) / 10, Object.keys(parent._sprite).length === 0 && (parent._sprite = { __default: [0, parent._duration * 1e3] }), parent._state !== "loaded" && (parent._state = "loaded", parent._emit("load"), parent._loadQueue()), self2._node.removeEventListener(Howler3._canPlayEvent, self2._loadFn, !1);
        },
        /**
         * HTML5 Audio ended listener callback.
         */
        _endListener: function() {
          var self2 = this, parent = self2._parent;
          parent._duration === 1 / 0 && (parent._duration = Math.ceil(self2._node.duration * 10) / 10, parent._sprite.__default[1] === 1 / 0 && (parent._sprite.__default[1] = parent._duration * 1e3), parent._ended(self2)), self2._node.removeEventListener("ended", self2._endFn, !1);
        }
      };
      var cache = {}, loadBuffer = function(self2) {
        var url = self2._src;
        if (cache[url]) {
          self2._duration = cache[url].duration, loadSound(self2);
          return;
        }
        if (/^data:[^;]+;base64,/.test(url)) {
          for (var data = atob(url.split(",")[1]), dataView = new Uint8Array(data.length), i = 0; i < data.length; ++i)
            dataView[i] = data.charCodeAt(i);
          decodeAudioData(dataView.buffer, self2);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open(self2._xhr.method, url, !0), xhr.withCredentials = self2._xhr.withCredentials, xhr.responseType = "arraybuffer", self2._xhr.headers && Object.keys(self2._xhr.headers).forEach(function(key) {
            xhr.setRequestHeader(key, self2._xhr.headers[key]);
          }), xhr.onload = function() {
            var code = (xhr.status + "")[0];
            if (code !== "0" && code !== "2" && code !== "3") {
              self2._emit("loaderror", null, "Failed loading audio file with status: " + xhr.status + ".");
              return;
            }
            decodeAudioData(xhr.response, self2);
          }, xhr.onerror = function() {
            self2._webAudio && (self2._html5 = !0, self2._webAudio = !1, self2._sounds = [], delete cache[url], self2.load());
          }, safeXhrSend(xhr);
        }
      }, safeXhrSend = function(xhr) {
        try {
          xhr.send();
        } catch {
          xhr.onerror();
        }
      }, decodeAudioData = function(arraybuffer, self2) {
        var error = function() {
          self2._emit("loaderror", null, "Decoding audio data failed.");
        }, success = function(buffer) {
          buffer && self2._sounds.length > 0 ? (cache[self2._src] = buffer, loadSound(self2, buffer)) : error();
        };
        typeof Promise < "u" && Howler3.ctx.decodeAudioData.length === 1 ? Howler3.ctx.decodeAudioData(arraybuffer).then(success).catch(error) : Howler3.ctx.decodeAudioData(arraybuffer, success, error);
      }, loadSound = function(self2, buffer) {
        buffer && !self2._duration && (self2._duration = buffer.duration), Object.keys(self2._sprite).length === 0 && (self2._sprite = { __default: [0, self2._duration * 1e3] }), self2._state !== "loaded" && (self2._state = "loaded", self2._emit("load"), self2._loadQueue());
      }, setupAudioContext = function() {
        if (Howler3.usingWebAudio) {
          try {
            typeof AudioContext < "u" ? Howler3.ctx = new AudioContext() : typeof webkitAudioContext < "u" ? Howler3.ctx = new webkitAudioContext() : Howler3.usingWebAudio = !1;
          } catch {
            Howler3.usingWebAudio = !1;
          }
          Howler3.ctx || (Howler3.usingWebAudio = !1);
          var iOS = /iP(hone|od|ad)/.test(Howler3._navigator && Howler3._navigator.platform), appVersion = Howler3._navigator && Howler3._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/), version = appVersion ? parseInt(appVersion[1], 10) : null;
          if (iOS && version && version < 9) {
            var safari = /safari/.test(Howler3._navigator && Howler3._navigator.userAgent.toLowerCase());
            Howler3._navigator && !safari && (Howler3.usingWebAudio = !1);
          }
          Howler3.usingWebAudio && (Howler3.masterGain = typeof Howler3.ctx.createGain > "u" ? Howler3.ctx.createGainNode() : Howler3.ctx.createGain(), Howler3.masterGain.gain.setValueAtTime(Howler3._muted ? 0 : Howler3._volume, Howler3.ctx.currentTime), Howler3.masterGain.connect(Howler3.ctx.destination)), Howler3._setup();
        }
      };
      typeof define == "function" && define.amd && define([], function() {
        return {
          Howler: Howler3,
          Howl: Howl3
        };
      }), typeof exports < "u" && (exports.Howler = Howler3, exports.Howl = Howl3), typeof global < "u" ? (global.HowlerGlobal = HowlerGlobal2, global.Howler = Howler3, global.Howl = Howl3, global.Sound = Sound2) : typeof window < "u" && (window.HowlerGlobal = HowlerGlobal2, window.Howler = Howler3, window.Howl = Howl3, window.Sound = Sound2);
    })();
    (function() {
      "use strict";
      HowlerGlobal.prototype._pos = [0, 0, 0], HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0], HowlerGlobal.prototype.stereo = function(pan) {
        var self2 = this;
        if (!self2.ctx || !self2.ctx.listener)
          return self2;
        for (var i = self2._howls.length - 1; i >= 0; i--)
          self2._howls[i].stereo(pan);
        return self2;
      }, HowlerGlobal.prototype.pos = function(x, y, z) {
        var self2 = this;
        if (!self2.ctx || !self2.ctx.listener)
          return self2;
        if (y = typeof y != "number" ? self2._pos[1] : y, z = typeof z != "number" ? self2._pos[2] : z, typeof x == "number")
          self2._pos = [x, y, z], typeof self2.ctx.listener.positionX < "u" ? (self2.ctx.listener.positionX.setTargetAtTime(self2._pos[0], Howler.ctx.currentTime, 0.1), self2.ctx.listener.positionY.setTargetAtTime(self2._pos[1], Howler.ctx.currentTime, 0.1), self2.ctx.listener.positionZ.setTargetAtTime(self2._pos[2], Howler.ctx.currentTime, 0.1)) : self2.ctx.listener.setPosition(self2._pos[0], self2._pos[1], self2._pos[2]);
        else
          return self2._pos;
        return self2;
      }, HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
        var self2 = this;
        if (!self2.ctx || !self2.ctx.listener)
          return self2;
        var or = self2._orientation;
        if (y = typeof y != "number" ? or[1] : y, z = typeof z != "number" ? or[2] : z, xUp = typeof xUp != "number" ? or[3] : xUp, yUp = typeof yUp != "number" ? or[4] : yUp, zUp = typeof zUp != "number" ? or[5] : zUp, typeof x == "number")
          self2._orientation = [x, y, z, xUp, yUp, zUp], typeof self2.ctx.listener.forwardX < "u" ? (self2.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1), self2.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1), self2.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1), self2.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1), self2.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1), self2.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1)) : self2.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
        else
          return or;
        return self2;
      }, Howl.prototype.init = /* @__PURE__ */ (function(_super) {
        return function(o) {
          var self2 = this;
          return self2._orientation = o.orientation || [1, 0, 0], self2._stereo = o.stereo || null, self2._pos = o.pos || null, self2._pannerAttr = {
            coneInnerAngle: typeof o.coneInnerAngle < "u" ? o.coneInnerAngle : 360,
            coneOuterAngle: typeof o.coneOuterAngle < "u" ? o.coneOuterAngle : 360,
            coneOuterGain: typeof o.coneOuterGain < "u" ? o.coneOuterGain : 0,
            distanceModel: typeof o.distanceModel < "u" ? o.distanceModel : "inverse",
            maxDistance: typeof o.maxDistance < "u" ? o.maxDistance : 1e4,
            panningModel: typeof o.panningModel < "u" ? o.panningModel : "HRTF",
            refDistance: typeof o.refDistance < "u" ? o.refDistance : 1,
            rolloffFactor: typeof o.rolloffFactor < "u" ? o.rolloffFactor : 1
          }, self2._onstereo = o.onstereo ? [{ fn: o.onstereo }] : [], self2._onpos = o.onpos ? [{ fn: o.onpos }] : [], self2._onorientation = o.onorientation ? [{ fn: o.onorientation }] : [], _super.call(this, o);
        };
      })(Howl.prototype.init), Howl.prototype.stereo = function(pan, id) {
        var self2 = this;
        if (!self2._webAudio)
          return self2;
        if (self2._state !== "loaded")
          return self2._queue.push({
            event: "stereo",
            action: function() {
              self2.stereo(pan, id);
            }
          }), self2;
        var pannerType = typeof Howler.ctx.createStereoPanner > "u" ? "spatial" : "stereo";
        if (typeof id > "u")
          if (typeof pan == "number")
            self2._stereo = pan, self2._pos = [pan, 0, 0];
          else
            return self2._stereo;
        for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
          var sound = self2._soundById(ids[i]);
          if (sound)
            if (typeof pan == "number")
              sound._stereo = pan, sound._pos = [pan, 0, 0], sound._node && (sound._pannerAttr.panningModel = "equalpower", (!sound._panner || !sound._panner.pan) && setupPanner(sound, pannerType), pannerType === "spatial" ? typeof sound._panner.positionX < "u" ? (sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime), sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime), sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime)) : sound._panner.setPosition(pan, 0, 0) : sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime)), self2._emit("stereo", sound._id);
            else
              return sound._stereo;
        }
        return self2;
      }, Howl.prototype.pos = function(x, y, z, id) {
        var self2 = this;
        if (!self2._webAudio)
          return self2;
        if (self2._state !== "loaded")
          return self2._queue.push({
            event: "pos",
            action: function() {
              self2.pos(x, y, z, id);
            }
          }), self2;
        if (y = typeof y != "number" ? 0 : y, z = typeof z != "number" ? -0.5 : z, typeof id > "u")
          if (typeof x == "number")
            self2._pos = [x, y, z];
          else
            return self2._pos;
        for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
          var sound = self2._soundById(ids[i]);
          if (sound)
            if (typeof x == "number")
              sound._pos = [x, y, z], sound._node && ((!sound._panner || sound._panner.pan) && setupPanner(sound, "spatial"), typeof sound._panner.positionX < "u" ? (sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime), sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime), sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime)) : sound._panner.setPosition(x, y, z)), self2._emit("pos", sound._id);
            else
              return sound._pos;
        }
        return self2;
      }, Howl.prototype.orientation = function(x, y, z, id) {
        var self2 = this;
        if (!self2._webAudio)
          return self2;
        if (self2._state !== "loaded")
          return self2._queue.push({
            event: "orientation",
            action: function() {
              self2.orientation(x, y, z, id);
            }
          }), self2;
        if (y = typeof y != "number" ? self2._orientation[1] : y, z = typeof z != "number" ? self2._orientation[2] : z, typeof id > "u")
          if (typeof x == "number")
            self2._orientation = [x, y, z];
          else
            return self2._orientation;
        for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++) {
          var sound = self2._soundById(ids[i]);
          if (sound)
            if (typeof x == "number")
              sound._orientation = [x, y, z], sound._node && (sound._panner || (sound._pos || (sound._pos = self2._pos || [0, 0, -0.5]), setupPanner(sound, "spatial")), typeof sound._panner.orientationX < "u" ? (sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime), sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime), sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime)) : sound._panner.setOrientation(x, y, z)), self2._emit("orientation", sound._id);
            else
              return sound._orientation;
        }
        return self2;
      }, Howl.prototype.pannerAttr = function() {
        var self2 = this, args = arguments, o, id, sound;
        if (!self2._webAudio)
          return self2;
        if (args.length === 0)
          return self2._pannerAttr;
        if (args.length === 1)
          if (typeof args[0] == "object")
            o = args[0], typeof id > "u" && (o.pannerAttr || (o.pannerAttr = {
              coneInnerAngle: o.coneInnerAngle,
              coneOuterAngle: o.coneOuterAngle,
              coneOuterGain: o.coneOuterGain,
              distanceModel: o.distanceModel,
              maxDistance: o.maxDistance,
              refDistance: o.refDistance,
              rolloffFactor: o.rolloffFactor,
              panningModel: o.panningModel
            }), self2._pannerAttr = {
              coneInnerAngle: typeof o.pannerAttr.coneInnerAngle < "u" ? o.pannerAttr.coneInnerAngle : self2._coneInnerAngle,
              coneOuterAngle: typeof o.pannerAttr.coneOuterAngle < "u" ? o.pannerAttr.coneOuterAngle : self2._coneOuterAngle,
              coneOuterGain: typeof o.pannerAttr.coneOuterGain < "u" ? o.pannerAttr.coneOuterGain : self2._coneOuterGain,
              distanceModel: typeof o.pannerAttr.distanceModel < "u" ? o.pannerAttr.distanceModel : self2._distanceModel,
              maxDistance: typeof o.pannerAttr.maxDistance < "u" ? o.pannerAttr.maxDistance : self2._maxDistance,
              refDistance: typeof o.pannerAttr.refDistance < "u" ? o.pannerAttr.refDistance : self2._refDistance,
              rolloffFactor: typeof o.pannerAttr.rolloffFactor < "u" ? o.pannerAttr.rolloffFactor : self2._rolloffFactor,
              panningModel: typeof o.pannerAttr.panningModel < "u" ? o.pannerAttr.panningModel : self2._panningModel
            });
          else
            return sound = self2._soundById(parseInt(args[0], 10)), sound ? sound._pannerAttr : self2._pannerAttr;
        else args.length === 2 && (o = args[0], id = parseInt(args[1], 10));
        for (var ids = self2._getSoundIds(id), i = 0; i < ids.length; i++)
          if (sound = self2._soundById(ids[i]), sound) {
            var pa = sound._pannerAttr;
            pa = {
              coneInnerAngle: typeof o.coneInnerAngle < "u" ? o.coneInnerAngle : pa.coneInnerAngle,
              coneOuterAngle: typeof o.coneOuterAngle < "u" ? o.coneOuterAngle : pa.coneOuterAngle,
              coneOuterGain: typeof o.coneOuterGain < "u" ? o.coneOuterGain : pa.coneOuterGain,
              distanceModel: typeof o.distanceModel < "u" ? o.distanceModel : pa.distanceModel,
              maxDistance: typeof o.maxDistance < "u" ? o.maxDistance : pa.maxDistance,
              refDistance: typeof o.refDistance < "u" ? o.refDistance : pa.refDistance,
              rolloffFactor: typeof o.rolloffFactor < "u" ? o.rolloffFactor : pa.rolloffFactor,
              panningModel: typeof o.panningModel < "u" ? o.panningModel : pa.panningModel
            };
            var panner = sound._panner;
            panner || (sound._pos || (sound._pos = self2._pos || [0, 0, -0.5]), setupPanner(sound, "spatial"), panner = sound._panner), panner.coneInnerAngle = pa.coneInnerAngle, panner.coneOuterAngle = pa.coneOuterAngle, panner.coneOuterGain = pa.coneOuterGain, panner.distanceModel = pa.distanceModel, panner.maxDistance = pa.maxDistance, panner.refDistance = pa.refDistance, panner.rolloffFactor = pa.rolloffFactor, panner.panningModel = pa.panningModel;
          }
        return self2;
      }, Sound.prototype.init = /* @__PURE__ */ (function(_super) {
        return function() {
          var self2 = this, parent = self2._parent;
          self2._orientation = parent._orientation, self2._stereo = parent._stereo, self2._pos = parent._pos, self2._pannerAttr = parent._pannerAttr, _super.call(this), self2._stereo ? parent.stereo(self2._stereo) : self2._pos && parent.pos(self2._pos[0], self2._pos[1], self2._pos[2], self2._id);
        };
      })(Sound.prototype.init), Sound.prototype.reset = /* @__PURE__ */ (function(_super) {
        return function() {
          var self2 = this, parent = self2._parent;
          return self2._orientation = parent._orientation, self2._stereo = parent._stereo, self2._pos = parent._pos, self2._pannerAttr = parent._pannerAttr, self2._stereo ? parent.stereo(self2._stereo) : self2._pos ? parent.pos(self2._pos[0], self2._pos[1], self2._pos[2], self2._id) : self2._panner && (self2._panner.disconnect(0), self2._panner = void 0, parent._refreshBuffer(self2)), _super.call(this);
        };
      })(Sound.prototype.reset);
      var setupPanner = function(sound, type) {
        type = type || "spatial", type === "spatial" ? (sound._panner = Howler.ctx.createPanner(), sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle, sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle, sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain, sound._panner.distanceModel = sound._pannerAttr.distanceModel, sound._panner.maxDistance = sound._pannerAttr.maxDistance, sound._panner.refDistance = sound._pannerAttr.refDistance, sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor, sound._panner.panningModel = sound._pannerAttr.panningModel, typeof sound._panner.positionX < "u" ? (sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime), sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime), sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime)) : sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]), typeof sound._panner.orientationX < "u" ? (sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime), sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime), sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime)) : sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2])) : (sound._panner = Howler.ctx.createStereoPanner(), sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime)), sound._panner.connect(sound._node), sound._paused || sound._parent.pause(sound._id, !0).play(sound._id, !0);
      };
    })();
  }
});

// src/showcases/audio-intent/vendor/retained/audioRuntime.ts.txt
var import_howler = __toESM(require_howler());
import_howler.Howler.autoUnlock = !1;
import_howler.Howler.html5PoolSize = 10;
var armed = !1, pcmContext = null;
function armAudio() {
  armed = !0;
  let pool = import_howler.Howler;
  if (typeof pool._releaseHtml5Audio == "function" && Array.isArray(pool._html5AudioPool))
    for (; pool._html5AudioPool.length < import_howler.Howler.html5PoolSize; ) {
      let audio = new Audio();
      audio.load(), audio._unlocked = !0, pool._releaseHtml5Audio(audio);
    }
  try {
    pcmContext ??= new AudioContext(), pcmContext.state !== "running" && pcmContext.resume().catch(() => {
    });
  } catch {
    pcmContext = null;
  }
}
function isAudioArmed() {
  return armed;
}
function getPcmContext() {
  return pcmContext;
}

// node_modules/@vue/shared/dist/shared.esm-bundler.js
// @__NO_SIDE_EFFECTS__
function makeMap(str) {
  let map = /* @__PURE__ */ Object.create(null);
  for (let key of str.split(",")) map[key] = 1;
  return (val) => val in map;
}
var EMPTY_OBJ = {};
var NO = () => !1;
var extend = Object.assign;
var hasOwnProperty = Object.prototype.hasOwnProperty, hasOwn = (val, key) => hasOwnProperty.call(val, key), isArray = Array.isArray, isMap = (val) => toTypeString(val) === "[object Map]";
var isFunction = (val) => typeof val == "function", isString = (val) => typeof val == "string", isSymbol = (val) => typeof val == "symbol", isObject = (val) => val !== null && typeof val == "object", isPromise = (val) => (isObject(val) || isFunction(val)) && isFunction(val.then) && isFunction(val.catch), objectToString = Object.prototype.toString, toTypeString = (value) => objectToString.call(value), toRawType = (value) => toTypeString(value).slice(8, -1);
var isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
var cacheStringFunction = (fn) => {
  let cache = /* @__PURE__ */ Object.create(null);
  return ((str) => cache[str] || (cache[str] = fn(str)));
}, camelizeRE = /-\w/g, camelize = cacheStringFunction(
  (str) => str.replace(camelizeRE, (c) => c.slice(1).toUpperCase())
), hyphenateRE = /\B([A-Z])/g, hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, "-$1").toLowerCase()
), capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1)), toHandlerKey = cacheStringFunction(
  (str) => str ? `on${capitalize(str)}` : ""
), hasChanged = (value, oldValue) => !Object.is(value, oldValue);
var _globalThis, getGlobalThis = () => _globalThis || (_globalThis = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
var specialBooleanAttrs = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly";
var isBooleanAttr = /* @__PURE__ */ makeMap(
  specialBooleanAttrs + ",async,autofocus,autoplay,controls,default,defer,disabled,hidden,inert,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected"
);

// node_modules/@vue/reactivity/dist/reactivity.esm-bundler.js
var activeSub;
var batchDepth = 0, batchedSub, batchedComputed;
function startBatch() {
  batchDepth++;
}
function endBatch() {
  if (--batchDepth > 0)
    return;
  if (batchedComputed) {
    let e = batchedComputed;
    for (batchedComputed = void 0; e; ) {
      let next = e.next;
      e.next = void 0, e.flags &= -9, e = next;
    }
  }
  let error;
  for (; batchedSub; ) {
    let e = batchedSub;
    for (batchedSub = void 0; e; ) {
      let next = e.next;
      if (e.next = void 0, e.flags &= -9, e.flags & 1)
        try {
          e.trigger();
        } catch (err) {
          error || (error = err);
        }
      e = next;
    }
  }
  if (error) throw error;
}
var shouldTrack = !0, trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack), shouldTrack = !1;
}
function resetTracking() {
  let last = trackStack.pop();
  shouldTrack = last === void 0 ? !0 : last;
}
var globalVersion = 0, Link = class {
  constructor(sub, dep) {
    this.sub = sub, this.dep = dep, this.version = dep.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}, Dep = class {
  // TODO isolatedDeclarations "__v_skip"
  constructor(computed2) {
    this.computed = computed2, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(debugInfo) {
    if (!activeSub || !shouldTrack || activeSub === this.computed)
      return;
    let link = this.activeLink;
    if (link === void 0 || link.sub !== activeSub)
      link = this.activeLink = new Link(activeSub, this), activeSub.deps ? (link.prevDep = activeSub.depsTail, activeSub.depsTail.nextDep = link, activeSub.depsTail = link) : activeSub.deps = activeSub.depsTail = link, addSub(link);
    else if (link.version === -1 && (link.version = this.version, link.nextDep)) {
      let next = link.nextDep;
      next.prevDep = link.prevDep, link.prevDep && (link.prevDep.nextDep = next), link.prevDep = activeSub.depsTail, link.nextDep = void 0, activeSub.depsTail.nextDep = link, activeSub.depsTail = link, activeSub.deps === link && (activeSub.deps = next);
    }
    return link;
  }
  trigger(debugInfo) {
    this.version++, globalVersion++, this.notify(debugInfo);
  }
  notify(debugInfo) {
    startBatch();
    try {
      for (let link = this.subs; link; link = link.prevSub)
        link.sub.notify() && link.sub.dep.notify();
    } finally {
      endBatch();
    }
  }
};
function addSub(link) {
  if (link.dep.sc++, link.sub.flags & 4) {
    let computed2 = link.dep.computed;
    if (computed2 && !link.dep.subs) {
      computed2.flags |= 20;
      for (let l = computed2.deps; l; l = l.nextDep)
        addSub(l);
    }
    let currentTail = link.dep.subs;
    currentTail !== link && (link.prevSub = currentTail, currentTail && (currentTail.nextSub = link)), link.dep.subs = link;
  }
}
var targetMap = /* @__PURE__ */ new WeakMap(), ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
), MAP_KEY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
), ARRAY_ITERATE_KEY = /* @__PURE__ */ Symbol(
  ""
);
function track(target, type, key) {
  if (shouldTrack && activeSub) {
    let depsMap = targetMap.get(target);
    depsMap || targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    let dep = depsMap.get(key);
    dep || (depsMap.set(key, dep = new Dep()), dep.map = depsMap, dep.key = key), dep.track();
  }
}
function trigger(target, type, key, newValue, oldValue, oldTarget) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    globalVersion++;
    return;
  }
  let run = (dep) => {
    dep && dep.trigger();
  };
  if (startBatch(), type === "clear")
    depsMap.forEach(run);
  else {
    let targetIsArray = isArray(target), isArrayIndex = targetIsArray && isIntegerKey(key);
    if (targetIsArray && key === "length") {
      let newLength = Number(newValue);
      depsMap.forEach((dep, key2) => {
        (key2 === "length" || key2 === ARRAY_ITERATE_KEY || !isSymbol(key2) && key2 >= newLength) && run(dep);
      });
    } else
      switch ((key !== void 0 || depsMap.has(void 0)) && run(depsMap.get(key)), isArrayIndex && run(depsMap.get(ARRAY_ITERATE_KEY)), type) {
        case "add":
          targetIsArray ? isArrayIndex && run(depsMap.get("length")) : (run(depsMap.get(ITERATE_KEY)), isMap(target) && run(depsMap.get(MAP_KEY_ITERATE_KEY)));
          break;
        case "delete":
          targetIsArray || (run(depsMap.get(ITERATE_KEY)), isMap(target) && run(depsMap.get(MAP_KEY_ITERATE_KEY)));
          break;
        case "set":
          isMap(target) && run(depsMap.get(ITERATE_KEY));
          break;
      }
  }
  endBatch();
}
function reactiveReadArray(array) {
  let raw = /* @__PURE__ */ toRaw(array);
  return raw === array ? raw : (track(raw, "iterate", ARRAY_ITERATE_KEY), /* @__PURE__ */ isShallow(array) ? raw : raw.map(toReactive));
}
function shallowReadArray(arr) {
  return track(arr = /* @__PURE__ */ toRaw(arr), "iterate", ARRAY_ITERATE_KEY), arr;
}
function toWrapped(target, item) {
  return /* @__PURE__ */ isReadonly(target) ? toReadonly(/* @__PURE__ */ isReactive(target) ? toReactive(item) : item) : toReactive(item);
}
var arrayInstrumentations = {
  __proto__: null,
  [Symbol.iterator]() {
    return iterator(this, Symbol.iterator, (item) => toWrapped(this, item));
  },
  concat(...args) {
    return reactiveReadArray(this).concat(
      ...args.map((x) => isArray(x) ? reactiveReadArray(x) : x)
    );
  },
  entries() {
    return iterator(this, "entries", (value) => (value[1] = toWrapped(this, value[1]), value));
  },
  every(fn, thisArg) {
    return apply(this, "every", fn, thisArg, void 0, arguments);
  },
  filter(fn, thisArg) {
    return apply(
      this,
      "filter",
      fn,
      thisArg,
      (v) => v.map((item) => toWrapped(this, item)),
      arguments
    );
  },
  find(fn, thisArg) {
    return apply(
      this,
      "find",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findIndex(fn, thisArg) {
    return apply(this, "findIndex", fn, thisArg, void 0, arguments);
  },
  findLast(fn, thisArg) {
    return apply(
      this,
      "findLast",
      fn,
      thisArg,
      (item) => toWrapped(this, item),
      arguments
    );
  },
  findLastIndex(fn, thisArg) {
    return apply(this, "findLastIndex", fn, thisArg, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(fn, thisArg) {
    return apply(this, "forEach", fn, thisArg, void 0, arguments);
  },
  includes(...args) {
    return searchProxy(this, "includes", args);
  },
  indexOf(...args) {
    return searchProxy(this, "indexOf", args);
  },
  join(separator) {
    return reactiveReadArray(this).join(separator);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...args) {
    return searchProxy(this, "lastIndexOf", args);
  },
  map(fn, thisArg) {
    return apply(this, "map", fn, thisArg, void 0, arguments);
  },
  pop() {
    return noTracking(this, "pop");
  },
  push(...args) {
    return noTracking(this, "push", args);
  },
  reduce(fn, ...args) {
    return reduce(this, "reduce", fn, args);
  },
  reduceRight(fn, ...args) {
    return reduce(this, "reduceRight", fn, args);
  },
  shift() {
    return noTracking(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(fn, thisArg) {
    return apply(this, "some", fn, thisArg, void 0, arguments);
  },
  splice(...args) {
    return noTracking(this, "splice", args);
  },
  toReversed() {
    return reactiveReadArray(this).toReversed();
  },
  toSorted(comparer) {
    return reactiveReadArray(this).toSorted(comparer);
  },
  toSpliced(...args) {
    return reactiveReadArray(this).toSpliced(...args);
  },
  unshift(...args) {
    return noTracking(this, "unshift", args);
  },
  values() {
    return iterator(this, "values", (item) => toWrapped(this, item));
  }
};
function iterator(self2, method, wrapValue) {
  let arr = shallowReadArray(self2), iter = arr[method]();
  return arr !== self2 && !/* @__PURE__ */ isShallow(self2) && (iter._next = iter.next, iter.next = () => {
    let result = iter._next();
    return result.done || (result.value = wrapValue(result.value)), result;
  }), iter;
}
var arrayProto = Array.prototype;
function apply(self2, method, fn, thisArg, wrappedRetFn, args) {
  let arr = shallowReadArray(self2), needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2), methodFn = arr[method];
  if (methodFn !== arrayProto[method]) {
    let result2 = methodFn.apply(self2, args);
    return needsWrap ? toReactive(result2) : result2;
  }
  let wrappedFn = fn;
  arr !== self2 && (needsWrap ? wrappedFn = function(item, index) {
    return fn.call(this, toWrapped(self2, item), index, self2);
  } : fn.length > 2 && (wrappedFn = function(item, index) {
    return fn.call(this, item, index, self2);
  }));
  let result = methodFn.call(arr, wrappedFn, thisArg);
  return needsWrap && wrappedRetFn ? wrappedRetFn(result) : result;
}
function reduce(self2, method, fn, args) {
  let arr = shallowReadArray(self2), needsWrap = arr !== self2 && !/* @__PURE__ */ isShallow(self2), wrappedFn = fn, wrapInitialAccumulator = !1;
  arr !== self2 && (needsWrap ? (wrapInitialAccumulator = args.length === 0, wrappedFn = function(acc, item, index) {
    return wrapInitialAccumulator && (wrapInitialAccumulator = !1, acc = toWrapped(self2, acc)), fn.call(this, acc, toWrapped(self2, item), index, self2);
  }) : fn.length > 3 && (wrappedFn = function(acc, item, index) {
    return fn.call(this, acc, item, index, self2);
  }));
  let result = arr[method](wrappedFn, ...args);
  return wrapInitialAccumulator ? toWrapped(self2, result) : result;
}
function searchProxy(self2, method, args) {
  let arr = /* @__PURE__ */ toRaw(self2);
  track(arr, "iterate", ARRAY_ITERATE_KEY);
  let res = arr[method](...args);
  return (res === -1 || res === !1) && /* @__PURE__ */ isProxy(args[0]) ? (args[0] = /* @__PURE__ */ toRaw(args[0]), arr[method](...args)) : res;
}
function noTracking(self2, method, args = []) {
  pauseTracking(), startBatch();
  let res = (/* @__PURE__ */ toRaw(self2))[method].apply(self2, args);
  return endBatch(), resetTracking(), res;
}
var isNonTrackableKeys = /* @__PURE__ */ makeMap("__proto__,__v_isRef,__isVue"), builtInSymbols = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
);
function hasOwnProperty2(key) {
  isSymbol(key) || (key = String(key));
  let obj = /* @__PURE__ */ toRaw(this);
  return track(obj, "has", key), obj.hasOwnProperty(key);
}
var BaseReactiveHandler = class {
  constructor(_isReadonly = !1, _isShallow = !1) {
    this._isReadonly = _isReadonly, this._isShallow = _isShallow;
  }
  get(target, key, receiver) {
    if (key === "__v_skip") return target.__v_skip;
    let isReadonly2 = this._isReadonly, isShallow2 = this._isShallow;
    if (key === "__v_isReactive")
      return !isReadonly2;
    if (key === "__v_isReadonly")
      return isReadonly2;
    if (key === "__v_isShallow")
      return isShallow2;
    if (key === "__v_raw")
      return receiver === (isReadonly2 ? isShallow2 ? shallowReadonlyMap : readonlyMap : isShallow2 ? shallowReactiveMap : reactiveMap).get(target) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(target) === Object.getPrototypeOf(receiver) ? target : void 0;
    let targetIsArray = isArray(target);
    if (!isReadonly2) {
      let fn;
      if (targetIsArray && (fn = arrayInstrumentations[key]))
        return fn;
      if (key === "hasOwnProperty")
        return hasOwnProperty2;
    }
    let res = Reflect.get(
      target,
      key,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    if ((isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) || (isReadonly2 || track(target, "get", key), isShallow2))
      return res;
    if (/* @__PURE__ */ isRef(res)) {
      let value = targetIsArray && isIntegerKey(key) ? res : res.value;
      return isReadonly2 && isObject(value) ? /* @__PURE__ */ readonly(value) : value;
    }
    return isObject(res) ? isReadonly2 ? /* @__PURE__ */ readonly(res) : /* @__PURE__ */ reactive(res) : res;
  }
}, MutableReactiveHandler = class extends BaseReactiveHandler {
  constructor(isShallow2 = !1) {
    super(!1, isShallow2);
  }
  set(target, key, value, receiver) {
    let oldValue = target[key], isArrayWithIntegerKey = isArray(target) && isIntegerKey(key);
    if (!this._isShallow) {
      let isOldValueReadonly = /* @__PURE__ */ isReadonly(oldValue);
      if (!/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) && (oldValue = /* @__PURE__ */ toRaw(oldValue), value = /* @__PURE__ */ toRaw(value)), !isArrayWithIntegerKey && /* @__PURE__ */ isRef(oldValue) && !/* @__PURE__ */ isRef(value))
        return isOldValueReadonly || (oldValue.value = value), !0;
    }
    let hadKey = isArrayWithIntegerKey ? Number(key) < target.length : hasOwn(target, key), result = Reflect.set(
      target,
      key,
      value,
      /* @__PURE__ */ isRef(target) ? target : receiver
    );
    return target === /* @__PURE__ */ toRaw(receiver) && result && (hadKey ? hasChanged(value, oldValue) && trigger(target, "set", key, value, oldValue) : trigger(target, "add", key, value)), result;
  }
  deleteProperty(target, key) {
    let hadKey = hasOwn(target, key), oldValue = target[key], result = Reflect.deleteProperty(target, key);
    return result && hadKey && trigger(target, "delete", key, void 0, oldValue), result;
  }
  has(target, key) {
    let result = Reflect.has(target, key);
    return (!isSymbol(key) || !builtInSymbols.has(key)) && track(target, "has", key), result;
  }
  ownKeys(target) {
    return track(
      target,
      "iterate",
      isArray(target) ? "length" : ITERATE_KEY
    ), Reflect.ownKeys(target);
  }
}, ReadonlyReactiveHandler = class extends BaseReactiveHandler {
  constructor(isShallow2 = !1) {
    super(!0, isShallow2);
  }
  set(target, key) {
    return !0;
  }
  deleteProperty(target, key) {
    return !0;
  }
}, mutableHandlers = /* @__PURE__ */ new MutableReactiveHandler(), readonlyHandlers = /* @__PURE__ */ new ReadonlyReactiveHandler();
var toShallow = (value) => value, getProto = (v) => Reflect.getPrototypeOf(v);
function createIterableMethod(method, isReadonly2, isShallow2) {
  return function(...args) {
    let target = this.__v_raw, rawTarget = /* @__PURE__ */ toRaw(target), targetIsMap = isMap(rawTarget), isPair = method === "entries" || method === Symbol.iterator && targetIsMap, isKeyOnly = method === "keys" && targetIsMap, innerIterator = target[method](...args), wrap = isShallow2 ? toShallow : isReadonly2 ? toReadonly : toReactive;
    return !isReadonly2 && track(
      rawTarget,
      "iterate",
      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    ), extend(
      // inheriting all iterator properties
      Object.create(innerIterator),
      {
        // iterator protocol
        next() {
          let { value, done } = innerIterator.next();
          return done ? { value, done } : {
            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
            done
          };
        }
      }
    );
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? !1 : type === "clear" ? void 0 : this;
  };
}
function createInstrumentations(readonly3, shallow) {
  let instrumentations = {
    get(key) {
      let target = this.__v_raw, rawTarget = /* @__PURE__ */ toRaw(target), rawKey = /* @__PURE__ */ toRaw(key);
      readonly3 || (hasChanged(key, rawKey) && track(rawTarget, "get", key), track(rawTarget, "get", rawKey));
      let { has } = getProto(rawTarget), wrap = shallow ? toShallow : readonly3 ? toReadonly : toReactive;
      if (has.call(rawTarget, key))
        return wrap(target.get(key));
      if (has.call(rawTarget, rawKey))
        return wrap(target.get(rawKey));
      target !== rawTarget && target.get(key);
    },
    get size() {
      let target = this.__v_raw;
      return !readonly3 && track(/* @__PURE__ */ toRaw(target), "iterate", ITERATE_KEY), target.size;
    },
    has(key) {
      let target = this.__v_raw, rawTarget = /* @__PURE__ */ toRaw(target), rawKey = /* @__PURE__ */ toRaw(key);
      return readonly3 || (hasChanged(key, rawKey) && track(rawTarget, "has", key), track(rawTarget, "has", rawKey)), key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
    },
    forEach(callback, thisArg) {
      let observed = this, target = observed.__v_raw, rawTarget = /* @__PURE__ */ toRaw(target), wrap = shallow ? toShallow : readonly3 ? toReadonly : toReactive;
      return !readonly3 && track(rawTarget, "iterate", ITERATE_KEY), target.forEach((value, key) => callback.call(thisArg, wrap(value), wrap(key), observed));
    }
  };
  return extend(
    instrumentations,
    readonly3 ? {
      add: createReadonlyMethod("add"),
      set: createReadonlyMethod("set"),
      delete: createReadonlyMethod("delete"),
      clear: createReadonlyMethod("clear")
    } : {
      add(value) {
        let target = /* @__PURE__ */ toRaw(this), proto = getProto(target), rawValue = /* @__PURE__ */ toRaw(value), valueToAdd = !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) ? rawValue : value;
        return proto.has.call(target, valueToAdd) || hasChanged(value, valueToAdd) && proto.has.call(target, value) || hasChanged(rawValue, valueToAdd) && proto.has.call(target, rawValue) || (target.add(valueToAdd), trigger(target, "add", valueToAdd, valueToAdd)), this;
      },
      set(key, value) {
        !shallow && !/* @__PURE__ */ isShallow(value) && !/* @__PURE__ */ isReadonly(value) && (value = /* @__PURE__ */ toRaw(value));
        let target = /* @__PURE__ */ toRaw(this), { has, get } = getProto(target), hadKey = has.call(target, key);
        hadKey || (key = /* @__PURE__ */ toRaw(key), hadKey = has.call(target, key));
        let oldValue = get.call(target, key);
        return target.set(key, value), hadKey ? hasChanged(value, oldValue) && trigger(target, "set", key, value, oldValue) : trigger(target, "add", key, value), this;
      },
      delete(key) {
        let target = /* @__PURE__ */ toRaw(this), { has, get } = getProto(target), hadKey = has.call(target, key);
        hadKey || (key = /* @__PURE__ */ toRaw(key), hadKey = has.call(target, key));
        let oldValue = get ? get.call(target, key) : void 0, result = target.delete(key);
        return hadKey && trigger(target, "delete", key, void 0, oldValue), result;
      },
      clear() {
        let target = /* @__PURE__ */ toRaw(this), hadItems = target.size !== 0, oldTarget = void 0, result = target.clear();
        return hadItems && trigger(
          target,
          "clear",
          void 0,
          void 0,
          oldTarget
        ), result;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((method) => {
    instrumentations[method] = createIterableMethod(method, readonly3, shallow);
  }), instrumentations;
}
function createInstrumentationGetter(isReadonly2, shallow) {
  let instrumentations = createInstrumentations(isReadonly2, shallow);
  return (target, key, receiver) => key === "__v_isReactive" ? !isReadonly2 : key === "__v_isReadonly" ? isReadonly2 : key === "__v_raw" ? target : Reflect.get(
    hasOwn(instrumentations, key) && key in target ? instrumentations : target,
    key,
    receiver
  );
}
var mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(!1, !1)
};
var readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(!0, !1)
};
var reactiveMap = /* @__PURE__ */ new WeakMap(), shallowReactiveMap = /* @__PURE__ */ new WeakMap(), readonlyMap = /* @__PURE__ */ new WeakMap(), shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function reactive(target) {
  return /* @__PURE__ */ isReadonly(target) ? target : createReactiveObject(
    target,
    !1,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
// @__NO_SIDE_EFFECTS__
function readonly(target) {
  return createReactiveObject(
    target,
    !0,
    readonlyHandlers,
    readonlyCollectionHandlers,
    readonlyMap
  );
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target) || target.__v_raw && !(isReadonly2 && target.__v_isReactive) || target.__v_skip || !Object.isExtensible(target))
    return target;
  let existingProxy = proxyMap.get(target);
  if (existingProxy)
    return existingProxy;
  let targetType = targetTypeMap(toRawType(target));
  if (targetType === 0)
    return target;
  let proxy = new Proxy(
    target,
    targetType === 2 ? collectionHandlers : baseHandlers
  );
  return proxyMap.set(target, proxy), proxy;
}
// @__NO_SIDE_EFFECTS__
function isReactive(value) {
  return /* @__PURE__ */ isReadonly(value) ? /* @__PURE__ */ isReactive(value.__v_raw) : !!(value && value.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function isReadonly(value) {
  return !!(value && value.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function isShallow(value) {
  return !!(value && value.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function isProxy(value) {
  return value ? !!value.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function toRaw(observed) {
  let raw = observed && observed.__v_raw;
  return raw ? /* @__PURE__ */ toRaw(raw) : observed;
}
var toReactive = (value) => isObject(value) ? /* @__PURE__ */ reactive(value) : value, toReadonly = (value) => isObject(value) ? /* @__PURE__ */ readonly(value) : value;
// @__NO_SIDE_EFFECTS__
function isRef(r) {
  return r ? r.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function ref(value) {
  return createRef(value, !1);
}
function createRef(rawValue, shallow) {
  return /* @__PURE__ */ isRef(rawValue) ? rawValue : new RefImpl(rawValue, shallow);
}
var RefImpl = class {
  constructor(value, isShallow2) {
    this.dep = new Dep(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = isShallow2 ? value : /* @__PURE__ */ toRaw(value), this._value = isShallow2 ? value : toReactive(value), this.__v_isShallow = isShallow2;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(newValue) {
    let oldValue = this._rawValue, useDirectValue = this.__v_isShallow || /* @__PURE__ */ isShallow(newValue) || /* @__PURE__ */ isReadonly(newValue);
    newValue = useDirectValue ? newValue : /* @__PURE__ */ toRaw(newValue), hasChanged(newValue, oldValue) && (this._rawValue = newValue, this._value = useDirectValue ? newValue : toReactive(newValue), this.dep.trigger());
  }
};

// node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js
function callWithErrorHandling(fn, instance, type, args) {
  try {
    return args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction(fn)) {
    let res = callWithErrorHandling(fn, instance, type, args);
    return res && isPromise(res) && res.catch((err) => {
      handleError(err, instance, type);
    }), res;
  }
  if (isArray(fn)) {
    let values = [];
    for (let i = 0; i < fn.length; i++)
      values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
    return values;
  }
}
function handleError(err, instance, type, throwInDev = !0) {
  let contextVNode = instance ? instance.vnode : null, { errorHandler, throwUnhandledErrorInProduction } = instance && instance.appContext.config || EMPTY_OBJ;
  if (instance) {
    let cur = instance.parent, exposedInstance = instance.proxy, errorInfo = `https://vuejs.org/error-reference/#runtime-${type}`;
    for (; cur; ) {
      let errorCapturedHooks = cur.ec;
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++)
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === !1)
            return;
      }
      cur = cur.parent;
    }
    if (errorHandler) {
      pauseTracking(), callWithErrorHandling(errorHandler, null, 10, [
        err,
        exposedInstance,
        errorInfo
      ]), resetTracking();
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev, throwUnhandledErrorInProduction);
}
function logError(err, type, contextVNode, throwInDev = !0, throwInProd = !1) {
  if (throwInProd)
    throw err;
  console.error(err);
}
var requestIdleCallback = getGlobalThis().requestIdleCallback || ((cb) => setTimeout(cb, 1)), cancelIdleCallback = getGlobalThis().cancelIdleCallback || ((id) => clearTimeout(id));
function injectHook(type, hook, target = currentInstance, prepend = !1) {
  if (target) {
    let hooks = target[type] || (target[type] = []), wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      pauseTracking();
      let reset = setCurrentInstance(target), res = callWithAsyncErrorHandling(hook, target, type, args);
      return reset(), resetTracking(), res;
    });
    return prepend ? hooks.unshift(wrappedHook) : hooks.push(wrappedHook), wrappedHook;
  }
}
var createHook = (lifecycle) => (hook, target = currentInstance) => {
  (!isInSSRComponentSetup || lifecycle === "sp") && injectHook(lifecycle, (...args) => hook(...args), target);
}, onBeforeMount = createHook("bm"), onMounted = createHook("m"), onBeforeUpdate = createHook(
  "bu"
), onUpdated = createHook("u"), onBeforeUnmount = createHook(
  "bum"
), onUnmounted = createHook("um"), onServerPrefetch = createHook(
  "sp"
), onRenderTriggered = createHook("rtg"), onRenderTracked = createHook("rtc");
function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
var emptyAppContext = createAppContext();
var currentInstance = null;
var internalSetCurrentInstance, setInSSRSetupState;
{
  let g = getGlobalThis(), registerGlobalSetter = (key, setter) => {
    let setters;
    return (setters = g[key]) || (setters = g[key] = []), setters.push(setter), (v) => {
      setters.length > 1 ? setters.forEach((set) => set(v)) : setters[0](v);
    };
  };
  internalSetCurrentInstance = registerGlobalSetter(
    "__VUE_INSTANCE_SETTERS__",
    (v) => currentInstance = v
  ), setInSSRSetupState = registerGlobalSetter(
    "__VUE_SSR_SETTERS__",
    (v) => isInSSRComponentSetup = v
  );
}
var setCurrentInstance = (instance) => {
  let prev = currentInstance;
  return internalSetCurrentInstance(instance), instance.scope.on(), () => {
    instance.scope.off(), internalSetCurrentInstance(prev);
  };
};
var isInSSRComponentSetup = !1;

// src/showcases/audio-intent/vendor/telemetry.ts
var localAudioTelemetry = [];
function logTelemetry(message, data = {}, level = "info") {
  localAudioTelemetry.push({ message, data, level }), localAudioTelemetry.length > 12 && localAudioTelemetry.shift();
}

// src/showcases/audio-intent/vendor/retained/useWebAudioPlayer.ts.txt
function useWebAudioPlayer(options) {
  let isPlaying = ref(!1), isSynthesizing = ref(!1), onFirstPlayCallback = options?.onFirstPlay, onGapCallback = options?.onGap, currentHowl = null, currentBlobUrl = null, queue = [], isPlayingNext = !1, hasPlayedFirst = !1, currentIsExternalUrl = !1, expectedNextIndex = 0, chunkBuffer = /* @__PURE__ */ new Map(), gapWatchdogTimer = null;
  function clearGapWatchdog() {
    gapWatchdogTimer && (clearTimeout(gapWatchdogTimer), gapWatchdogTimer = null);
  }
  function startGapWatchdog() {
    gapWatchdogTimer || (gapWatchdogTimer = setTimeout(() => {
      if (gapWatchdogTimer = null, chunkBuffer.size === 0) return;
      let lowestBuffered = Math.min(...chunkBuffer.keys()), skippedIndices = [];
      for (let i = expectedNextIndex; i < lowestBuffered; i++)
        skippedIndices.push(i);
      for (console.warn(
        `[useWebAudioPlayer] Gap watchdog: skipping chunk(s) ${skippedIndices.join(", ")}, jumping to ${lowestBuffered}`
      ), logTelemetry(
        "TTS gap watchdog: chunks skipped",
        {
          skipped_indices: skippedIndices,
          jumped_to: lowestBuffered,
          buffer_size: chunkBuffer.size
        },
        "error"
      ), onGapCallback?.(), expectedNextIndex = lowestBuffered; chunkBuffer.has(expectedNextIndex); ) {
        let chunk = chunkBuffer.get(expectedNextIndex);
        chunkBuffer.delete(expectedNextIndex), chunk.url && queueUrl(chunk.url, chunk.format), chunk.isFinal && (isSynthesizing.value = !1), expectedNextIndex++;
      }
      chunkBuffer.size > 0 && startGapWatchdog();
    }, 1e4));
  }
  let playbackWatchdog = null, howlCreatedAt = 0;
  function clearPlaybackWatchdog() {
    playbackWatchdog && (clearInterval(playbackWatchdog), playbackWatchdog = null);
  }
  let streamCtx = null, streamSampleRate = 24e3, nextPlayTime = 0, scheduledSources = [], pendingScheduled = 0, streamEnded = !1, streamInitialBufferSeconds = 0, streamBufferedBeforeStart = 0, streamHasStarted = !1, streamPendingBuffers = [], streamGeneration = 0, streamUrlChain = Promise.resolve(), streamUsesUrls = !1, loggedUnarmedDrop = !1;
  function acceptsAudio() {
    return isAudioArmed() ? !0 : (loggedUnarmedDrop || (loggedUnarmedDrop = !0, logTelemetry("TTS audio dropped: page not armed by an audio gesture", {})), !1);
  }
  async function queueChunk(base64Audio, format) {
    if (acceptsAudio())
      try {
        let binaryString = atob(base64Audio), bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++)
          bytes[i] = binaryString.charCodeAt(i);
        let mimeType = getMimeType(format), blob = new Blob([bytes], { type: mimeType }), blobUrl = URL.createObjectURL(blob);
        queue.push({ blobUrl, format }), isPlayingNext || playNext();
      } catch (e) {
        console.warn("[useWebAudioPlayer] Failed to decode audio chunk:", e), logTelemetry(
          "TTS audio chunk decode failed",
          {
            format,
            error: String(e)
          },
          "error"
        );
      }
  }
  function queueUrl(url, format) {
    acceptsAudio() && (queue.push({ blobUrl: url, format, isExternalUrl: !0 }), isPlayingNext || playNext());
  }
  function cleanupCurrentHowl() {
    clearPlaybackWatchdog(), currentHowl && (currentHowl.unload(), currentHowl = null), currentBlobUrl && !currentIsExternalUrl && URL.revokeObjectURL(currentBlobUrl), currentBlobUrl = null, currentIsExternalUrl = !1;
  }
  function playNext() {
    if (queue.length === 0) {
      isPlayingNext = !1, isSynthesizing.value || (isPlaying.value = !1);
      return;
    }
    isPlayingNext = !0, isPlaying.value = !0;
    let entry = queue.shift();
    currentBlobUrl = entry.blobUrl, currentIsExternalUrl = entry.isExternalUrl ?? !1, howlCreatedAt = Date.now(), currentHowl = new import_howler.Howl({
      src: [entry.blobUrl],
      format: [entry.format === "mp3" ? "mp3" : entry.format === "wav" ? "wav" : entry.format],
      html5: !0,
      onend: () => {
        cleanupCurrentHowl(), playNext();
      },
      onplay: () => {
        hasPlayedFirst || (hasPlayedFirst = !0, onFirstPlayCallback?.());
      },
      onloaderror: (_id, err) => {
        console.warn("[useWebAudioPlayer] Failed to load audio chunk:", err), cleanupCurrentHowl(), playNext();
      },
      onplayerror: (_id, err) => {
        console.warn("[useWebAudioPlayer] Failed to play audio chunk:", err), cleanupCurrentHowl(), playNext();
      }
    }), currentHowl.play(), clearPlaybackWatchdog(), playbackWatchdog = setInterval(() => {
      if (!currentHowl) {
        clearPlaybackWatchdog();
        return;
      }
      if (Date.now() - howlCreatedAt < 3e3)
        return;
      let playing = currentHowl.playing(), seek = currentHowl.seek(), duration = currentHowl.duration();
      !playing && (seek > 0 || duration > 0 && duration < 1 / 0) && (console.warn("[useWebAudioPlayer] Watchdog: onend missed, advancing"), logTelemetry("TTS playback watchdog: onend missed", { seek, duration }), clearPlaybackWatchdog(), cleanupCurrentHowl(), playNext());
    }, 1e3);
  }
  function queueOrderedChunk(url, format, chunkIndex, isFinal = !1) {
    if (!acceptsAudio()) return;
    chunkBuffer.set(chunkIndex, { url, format, isFinal });
    let flushed = !1;
    for (; chunkBuffer.has(expectedNextIndex); ) {
      let chunk = chunkBuffer.get(expectedNextIndex);
      chunkBuffer.delete(expectedNextIndex), chunk.url && queueUrl(chunk.url, chunk.format), chunk.isFinal && (isSynthesizing.value = !1), expectedNextIndex++, flushed = !0;
    }
    flushed && clearGapWatchdog(), chunkBuffer.size > 0 && startGapWatchdog();
  }
  function skipOrderedChunk(chunkIndex, isFinal = !1) {
    if (chunkIndex === expectedNextIndex)
      for (expectedNextIndex++; chunkBuffer.has(expectedNextIndex); ) {
        let chunk = chunkBuffer.get(expectedNextIndex);
        chunkBuffer.delete(expectedNextIndex), chunk.url && queueUrl(chunk.url, chunk.format), chunk.isFinal && (isSynthesizing.value = !1), expectedNextIndex++;
      }
    else chunkIndex > expectedNextIndex && chunkBuffer.set(chunkIndex, { url: "", format: "", isFinal });
    isFinal && (isSynthesizing.value = !1), !isSynthesizing.value && !isPlayingNext && queue.length === 0 && !isStreamMode() && (isPlaying.value = !1), chunkBuffer.size > 0 ? startGapWatchdog() : clearGapWatchdog();
  }
  function resetChunkOrder() {
    expectedNextIndex = 0, chunkBuffer.clear(), clearGapWatchdog(), hasPlayedFirst = !1;
  }
  function startStream(format, sampleRate = 24e3, initialBufferSeconds = 0) {
    cleanupStream(), acceptsAudio() && (streamEnded = !1, streamInitialBufferSeconds = Math.max(0, initialBufferSeconds), streamBufferedBeforeStart = 0, streamHasStarted = streamInitialBufferSeconds === 0, streamPendingBuffers = [], isPlaying.value = streamHasStarted, streamSampleRate = sampleRate || 24e3, streamCtx = getPcmContext(), streamCtx && (streamCtx.state === "suspended" && streamCtx.resume().catch(() => {
    }), nextPlayTime = streamCtx.currentTime + (streamInitialBufferSeconds > 0 ? 0.03 : 0)));
  }
  function appendStreamData(base64Audio, sampleRate) {
    if (!streamCtx)
      return;
    let rate = sampleRate || streamSampleRate, binaryString = atob(base64Audio), len = binaryString.length, bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++)
      bytes[i] = binaryString.charCodeAt(i);
    appendPcmBytes(bytes, rate);
  }
  function appendPcmBytes(bytes, rate) {
    if (!streamCtx) return;
    let sampleCount = bytes.length >> 1;
    if (sampleCount === 0) return;
    let audioBuffer = streamCtx.createBuffer(1, sampleCount, rate), channel = audioBuffer.getChannelData(0), view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
    for (let i = 0; i < sampleCount; i++)
      channel[i] = view.getInt16(i * 2, !0) / 32768;
    if (!streamHasStarted) {
      streamPendingBuffers.push(audioBuffer), streamBufferedBeforeStart += audioBuffer.duration, releaseBufferedStreamIfReady();
      return;
    }
    if (nextPlayTime < streamCtx.currentTime - 0.02 && pendingScheduled === 0 && !streamEnded) {
      logTelemetry(
        "TTS file stream underflow; rebuffering",
        { sample_rate: rate, initial_buffer_seconds: streamInitialBufferSeconds },
        "error"
      ), streamHasStarted = !1, isPlaying.value = !1, streamPendingBuffers = [audioBuffer], streamBufferedBeforeStart = audioBuffer.duration, releaseBufferedStreamIfReady();
      return;
    }
    scheduleStreamBuffer(audioBuffer);
  }
  function releaseBufferedStreamIfReady() {
    if (!streamCtx || streamHasStarted || streamPendingBuffers.length === 0 || streamBufferedBeforeStart + 1e-3 < streamInitialBufferSeconds && !streamEnded) return;
    streamHasStarted = !0, isPlaying.value = !0, nextPlayTime = Math.max(nextPlayTime, streamCtx.currentTime + 0.03);
    let pending = streamPendingBuffers;
    streamPendingBuffers = [], streamBufferedBeforeStart = 0;
    for (let queuedBuffer of pending) scheduleStreamBuffer(queuedBuffer);
  }
  function scheduleStreamBuffer(audioBuffer) {
    if (!streamCtx) return;
    let source = streamCtx.createBufferSource();
    source.buffer = audioBuffer, source.connect(streamCtx.destination), nextPlayTime < streamCtx.currentTime && (nextPlayTime = streamCtx.currentTime + 0.03), pendingScheduled++, scheduledSources.push(source), source.onended = () => {
      pendingScheduled--, scheduledSources = scheduledSources.filter((s) => s !== source), maybeFinishStream();
    }, source.start(nextPlayTime), nextPlayTime += audioBuffer.duration, hasPlayedFirst || (hasPlayedFirst = !0, onFirstPlayCallback?.());
  }
  function appendStreamUrl(url, sampleRate) {
    let generation = streamGeneration;
    return streamEnded = !1, streamUsesUrls = !0, streamUrlChain = streamUrlChain.then(async () => {
      if (generation !== streamGeneration || !streamCtx) return;
      for (; streamCtx && nextPlayTime - streamCtx.currentTime > 3.1; )
        if (await new Promise((resolve) => setTimeout(resolve, 100)), generation !== streamGeneration) return;
      let response = await fetch(url);
      if (!response.ok) throw new Error(`Audio chunk fetch failed with HTTP ${response.status}`);
      let wav = new Uint8Array(await response.arrayBuffer()), parsed = extractWavPcm(wav);
      appendPcmBytes(parsed.pcm, sampleRate || parsed.sampleRate || streamSampleRate);
    }).catch((error) => {
      generation === streamGeneration && logTelemetry("TTS WAV stream fetch/decode failed", { url, error: String(error) }, "error");
    }), streamUrlChain;
  }
  function endStream() {
    if (!streamUsesUrls) {
      finishStreamInput();
      return;
    }
    let generation = streamGeneration;
    streamUrlChain.finally(() => {
      generation === streamGeneration && finishStreamInput();
    });
  }
  function finishStreamInput() {
    if (streamEnded = !0, !streamHasStarted && streamPendingBuffers.length > 0) {
      streamBufferedBeforeStart = streamInitialBufferSeconds;
      let pending = streamPendingBuffers;
      streamPendingBuffers = [], streamHasStarted = !0, isPlaying.value = !0, streamCtx && (nextPlayTime = Math.max(nextPlayTime, streamCtx.currentTime + 0.03));
      for (let queuedBuffer of pending) scheduleStreamBuffer(queuedBuffer);
    }
    maybeFinishStream();
  }
  function maybeFinishStream() {
    streamEnded && pendingScheduled <= 0 && !isSynthesizing.value && (isPlaying.value = !1);
  }
  function getMimeType(format) {
    switch (format) {
      case "mp3":
        return "audio/mpeg";
      case "opus":
        return 'audio/webm; codecs="opus"';
      case "aac":
        return "audio/aac";
      case "wav":
        return "audio/wav";
      default:
        return "audio/mpeg";
    }
  }
  function extractWavPcm(wav) {
    if (wav.length < 44 || String.fromCharCode(...wav.subarray(0, 4)) !== "RIFF")
      throw new Error("Invalid WAV chunk");
    let view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength), sampleRate = view.getUint32(24, !0), offset = 12;
    for (; offset + 8 <= wav.length; ) {
      let id = String.fromCharCode(...wav.subarray(offset, offset + 4)), size = view.getUint32(offset + 4, !0);
      if (id === "data") {
        let start = offset + 8;
        return { pcm: wav.subarray(start, Math.min(wav.length, start + size)), sampleRate };
      }
      offset += 8 + size + size % 2;
    }
    throw new Error("WAV data chunk missing");
  }
  function cleanupStream() {
    streamGeneration++;
    for (let source of scheduledSources)
      try {
        source.onended = null, source.stop();
      } catch {
      }
    scheduledSources = [], pendingScheduled = 0, streamEnded = !1, streamInitialBufferSeconds = 0, streamBufferedBeforeStart = 0, streamHasStarted = !1, streamPendingBuffers = [], streamUrlChain = Promise.resolve(), streamUsesUrls = !1, nextPlayTime = 0, streamCtx = null;
  }
  function isStreamMode() {
    return streamCtx !== null;
  }
  function stop2() {
    hasPlayedFirst = !1, clearPlaybackWatchdog(), currentHowl && (currentHowl.stop(), currentHowl.unload(), currentHowl = null), currentBlobUrl && !currentIsExternalUrl && URL.revokeObjectURL(currentBlobUrl), currentBlobUrl = null, currentIsExternalUrl = !1;
    for (let entry of queue)
      entry.isExternalUrl || URL.revokeObjectURL(entry.blobUrl);
    queue.length = 0, isPlayingNext = !1, resetChunkOrder(), cleanupStream(), isSynthesizing.value = !1, isPlaying.value = !1;
  }
  function setSynthesizing(value) {
    value && !acceptsAudio() || (isSynthesizing.value = value, !value && !isPlayingNext && queue.length === 0 && !isStreamMode() && (isPlaying.value = !1));
  }
  function destroy() {
    stop2();
  }
  function setOnFirstPlay(callback) {
    onFirstPlayCallback = callback;
  }
  function setOnGap(callback) {
    onGapCallback = callback;
  }
  return {
    isPlaying,
    isSynthesizing,
    // Queue mode (Groq/OpenAI and non-progressive providers)
    queueChunk,
    queueUrl,
    // Ordered chunk buffering (WebSocket TTS)
    queueOrderedChunk,
    skipOrderedChunk,
    resetChunkOrder,
    // Stream mode (ElevenLabs PCM / Qwen/Fish WAV)
    startStream,
    appendStreamData,
    appendStreamUrl,
    endStream,
    isStreamMode,
    // Shared
    stop: stop2,
    setSynthesizing,
    setOnGap,
    destroy,
    setOnFirstPlay
  };
}
var export_Howler = import_howler.Howler;
export {
  export_Howler as Howler,
  armAudio,
  isAudioArmed,
  useWebAudioPlayer
};
/*! Bundled license information:

howler/dist/howler.js:
  (*!
   *  howler.js v2.2.4
   *  howlerjs.com
   *
   *  (c) 2013-2020, James Simpson of GoldFire Studios
   *  goldfirestudios.com
   *
   *  MIT License
   *)
  (*!
   *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
   *  
   *  howler.js v2.2.4
   *  howlerjs.com
   *
   *  (c) 2013-2020, James Simpson of GoldFire Studios
   *  goldfirestudios.com
   *
   *  MIT License
   *)

@vue/shared/dist/shared.esm-bundler.js:
  (**
  * @vue/shared v3.5.40
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **)

@vue/reactivity/dist/reactivity.esm-bundler.js:
  (**
  * @vue/reactivity v3.5.40
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **)

@vue/runtime-core/dist/runtime-core.esm-bundler.js:
  (**
  * @vue/runtime-core v3.5.40
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **)

vue/dist/vue.runtime.esm-bundler.js:
  (**
  * vue v3.5.40
  * (c) 2018-present Yuxi (Evan) You and Vue contributors
  * @license MIT
  **)
*/
