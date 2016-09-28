$(document).ready(function() {
    if (window.location.protocol != "https:")
    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);

    function makeid() {
        var t = "";
        var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++) t += p.charAt(Math.floor(Math.random() * p.length));
        return t;
    }

    $('#chat-now').on("click", function(e) {
        e.preventDefault();
        var id = makeid();
        window.location.href = "chat.html?" + id;
    });


    /* CHAT */

    // grab the room from the URL
    var room = location.search && location.search.split('?')[1];

    // create our webrtc connection
    var webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: true,
        debug: false,
        detectSpeakingEvents: true,
        autoAdjustMic: false
    });

    // when it's ready, join if we got a room from the URL
    webrtc.on('readyToCall', function() {
        // you can name it anything
        if (room) webrtc.joinRoom('your awesome room name');
    });

    function showVolume(el, volume) {
        if (!el) return;
        if (volume < -45) { // vary between -45 and -20
            el.style.height = '0px';
        } else if (volume > -20) {
            el.style.height = '100%';
        } else {
            el.style.height = '' + Math.floor((volume + 100) * 100 / 25 - 220) + '%';
        }
    }
    webrtc.on('channelMessage', function(peer, label, data) {
        if (data.type == 'volume') {
            showVolume(document.getElementById('volume_' + peer.id), data.volume);
        }
    });

    // we got access to the camera
    webrtc.on('localStream', function(stream) {
        $('form>button').attr('disabled', null);
    });
    // we did not get access to the camera
    webrtc.on('localMediaError', function(err) {});

    // local screen obtained
    webrtc.on('localScreenAdded', function(video) {
        video.onclick = function() {
            video.style.width = video.videoWidth + 'px';
            video.style.height = video.videoHeight + 'px';
        };
        document.getElementById('localScreenContainer').appendChild(video);
        $('#localScreenContainer').show();
    });
    // local screen removed
    webrtc.on('localScreenRemoved', function(video) {
        document.getElementById('localScreenContainer').removeChild(video);
        $('#localScreenContainer').hide();
    });

    // a peer video has been added
    webrtc.on('videoAdded', function(video, peer) {
        console.log('video added', peer);
        var remotes = document.getElementById('remotes');
        if (remotes) {

            /*<div class="col s12 m3">
                        <div class="card">
                            <div class="card-image">
                                <img src="http://materializecss.com/images/sample-1.jpg">
                                <span class="card-title">Card Title</span>
                            </div>
                            <div class="card-content">
                                <p>I am a very simple card. I am good at containing small bits of information. I am convenient because I require little markup to use effectively.</p>
                            </div>
                            <div class="card-action">
                                <a href="#">This is a link</a>
                            </div>
                        </div>
                    </div>*/

            var container = document.createElement('div');
            container.className = 'col s4';
            container.id = 'container_' + webrtc.getDomId(peer);

            
            video.className = 'col s12 responsive-video ';
            container.appendChild(video);

            /* suppress contextmenu */
            video.oncontextmenu = function () { return false; };

            /* show the remote volume*/
            var vol = document.createElement('div');
            vol.id = 'volume_' + peer.id;
            vol.className = 'volumeBar';
            video.onclick = function () {
                //video.style.width = video.videoWidth + 'px';
                //video.style.height = video.videoHeight + 'px';
            };
            container.appendChild(vol);

            /* show the ice connection state*/
            if (peer && peer.pc) {
                var connstate = document.createElement('div');
                connstate.className = 'connectionstate center';
                container.appendChild(connstate);
                peer.pc.on('iceConnectionStateChange', function (event) {
                    switch (peer.pc.iceConnectionState) {
                        case 'checking': 
                        $(connstate).text('Conectando...');
                        break;
                        case 'connected':
                        case 'completed': // on caller side
                        $(connstate).text('Conectado.');
                        break;
                        case 'disconnected':
                        $(connstate).text('Desconectado.');
                        break;
                        case 'failed':
                        $(connstate).text('Conexion fallida.');
                        break;
                        case 'closed':
                        $(connstate).text('Conexion cerrada.');
                        break;
                    }
                });
            }
            remotes.appendChild(container);
        }


     
    });
    // a peer was removed
    webrtc.on('videoRemoved', function(video, peer) {
        console.log('video removed ', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById(peer ? 'container_' + webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
    });

    // local volume has changed
    webrtc.on('volumeChange', function(volume, treshold) {
        showVolume(document.getElementById('localVolume'), volume);
    });

    // Since we use this twice we put it here
    function setRoom(name) {
        $('form').remove();
        $('#room-title').text(name);
        $('#link-to-join').html('<strong>Comparte este salon:</strong> ' + location.href);
        $('body').addClass('active');
    }

    if (room) {
        setRoom(room);
    } else {
        $('form').submit(function() {
            var val = $('#sessionInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
            webrtc.createRoom(val, function(err, name) {
                console.log(' create room cb', arguments);

                var newUrl = location.pathname + '?' + name;
                if (!err) {
                    history.replaceState({
                        foo: 'bar'
                    }, null, newUrl);
                    setRoom(name);
                } else {
                    console.log(err);
                }
            });
            return false;
        });
    }

    var button = $('#screenShareButton'),
        setButton = function(bool) {
            button.text(bool ? 'share screen' : 'stop sharing');
        };
    if (!webrtc.capabilities.screenSharing) {
        button.attr('disabled', 'disabled');
    }
    webrtc.on('localScreenRemoved', function() {
        setButton(true);
    });

    setButton(true);

    button.click(function() {
        if (webrtc.getLocalScreen()) {
            webrtc.stopScreenShare();
            setButton(true);
        } else {
            webrtc.shareScreen(function(err) {
                if (err) {
                    setButton(true);
                } else {
                    setButton(false);
                }
            });

        }
    });

    $(document).ready(function(){
        $('.materialboxed').materialbox();
      });
});