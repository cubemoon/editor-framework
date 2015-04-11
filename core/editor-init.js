var Ipc = require('ipc');
var Util = require('util');
var Winston = require('winston');

Editor.Window = require('./editor-window');
Editor.Panel = require('./editor-panel');

// ==========================
// logs API
// ==========================

Editor.log = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.normal(text);
    Editor.sendToWindows('console:log', text);
};

Editor.success = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.success(text);
    Editor.sendToWindows('console:success', text);
};

Editor.failed = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.failed(text);
    Editor.sendToWindows('console:failed', text);
};

Editor.info = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.info(text);
    Editor.sendToWindows('console:info', text);
};

Editor.warn = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.warn(text);
    console.trace();
    Editor.sendToWindows('console:warn', text);
};

Editor.error = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.error(text);
    console.trace();
    Editor.sendToWindows('console:error', text);
};

Editor.fatal = function () {
    var text = Util.format.apply(Util, arguments);
    Winston.fatal(text);
    console.trace();

    // NOTE: fatal error will close app immediately, no need for ipc.
};

// ==========================
// profiles API
// ==========================

var _path2profiles = {};

// type: global, local, project
function _saveProfile ( path, profile ) {
    var json = JSON.stringify(profile, null, 2);
    Fs.writeFileSync(path, json, 'utf8');
}

// type: global, local, project
Editor.loadProfile = function ( path, defaultProfile ) {
    var profile = _path2profiles[path];
    if ( profile ) {
        return profile;
    }

    var profileProto = {
        save: function () {
            _saveProfile( path, this );
        },
        clear: function () {
            for ( var p in this ) {
                if ( p !== 'save' && p !== 'clear' ) {
                    delete this[p];
                }
            }
        },
    };

    profile = defaultProfile || {};

    if ( !Fs.existsSync(path) ) {
        Fs.writeFileSync(path, JSON.stringify(profile, null, 2));
    }
    else {
        try {
            profile = JSON.parse(Fs.readFileSync(path));
        }
        catch ( err ) {
            if ( err ) {
                Fire.warn( 'Failed to load profile %s, error message: %s', name, err.message );
                profile = {};
            }
        }
    }

    profile = Fire.JS.mixin( profile, profileProto );
    _path2profiles[path] = profile;

    return profile;
};

// ==========================
// misc API
// ==========================

Editor.quit = function () {
    var winlist = Editor.Window.windows;
    for ( var i = 0; i < winlist.length; ++i ) {
        winlist[i].close();
    }
};

// ==========================
// register builtin messages
// ==========================

// console
Ipc.on ( 'console:log', Editor.log );
Ipc.on ( 'console:warn', Editor.warn );
Ipc.on ( 'console:error', Editor.error );
Ipc.on ( 'console:success', Editor.success );
Ipc.on ( 'console:failed', Editor.failed );
Ipc.on ( 'console:info', Editor.info );
