var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');

module.exports = async function playsound(path, volume, cache, override) {
	// var file = fs.createReadStream(__dirname + '/bumblebee.wav');
	// var reader = new wav.Reader();
	// reader.on('format', function (format) {
	// 	// the WAVE header is stripped from the output of the reader
	// 	reader.pipe(new Speaker(format));
	// });
	// file.pipe(reader);
	//
	// console.log('playsound:', path, typeof path, volume, cache, override);
	// return;
	
	if (typeof volume === 'undefined' || volume === 1) {
		return new Promise((resolve, reject) => {
			try {
				const file = fs.createReadStream(path);
				const reader = new wav.Reader();
				reader.on('format', function (format) {
					// the WAVE header is stripped from the output of the reader
					const speaker = new Speaker(format);
					speaker.on('close', function () {
						resolve();
					});
					reader.pipe(speaker);
				});
				file.pipe(reader);
			}
			catch(e) {
				reject(e);
			}
		});
	}
	else {
		// return new Promise((resolve, reject) => {
		// 	var reader = new wav.Reader();
		// 	var file = fs.createReadStream(file + '.wav');
		//
		// 	let stream = new Duplex();
		// 	stream.push(data);
		// 	stream.push(null);
		//
		// 	reader.on('format', function (format) {
		// 		// the WAVE header is stripped from the output of the reader
		// 		reader.pipe(new Speaker(format)).then(r => {
		// 			resolve();
		// 		})
		// 	});
		// 	file.pipe(reader);
		// });
		// playWithVolume();
	}
}

// function playWithVolume(data, volume, options, callback) {
// 	const speaker = new Speaker(options);
//
// 	let stream = new Duplex();
// 	stream.push(data);
// 	stream.push(null);
//
// 	speaker.on('close', function () {
// 		callback();
// 	});
//
// 	if (volume < 1) {
// 		const volumeStream = new Volume();
// 		volumeStream.setVolume(volume);
// 		volumeStream.pipe(speaker);
// 		stream.pipe(volumeStream);
// 	}
// 	else {
// 		stream.pipe(speaker);
// 	}
//
// 	stream.destroy();
// }