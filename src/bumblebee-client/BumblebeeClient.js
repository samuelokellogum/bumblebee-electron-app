import EventEmitter from 'events';
import {connectSayQueue} from './SayQueue';
// import {connectMicrophone} from './Microphone';
import Hotword from 'bumblebee-hotword';
import {connectPlaySound} from './playSound';
import drawVADCanvas, {clearVADCanvas} from './drawVADCanvas';

import choose from './choose';
import SpectrumAnalyser from "./audio-spectrum-analyser";

const ipcRenderer = window.ipcRenderer;

class BumblebeeClient extends EventEmitter {
	constructor(app) {
		super();
		
		window.bumblebee = this;
		
		this.app = app;
		this.apps = {};
		this.assistants = {};
		
		this.choose = choose;
		
		// this.microphone = connectMicrophone(this, app);
		
		this.hotword = new Hotword();
		this.hotword.bufferSize = 512;
		this.hotword.setSensitivity(0.5);
		
		this.hotword.setWorkersPath('./bumblebee-workers');
		
		this.hotword.addHotword('bumblebee');
		this.hotword.addHotword('grasshopper');
		this.hotword.addHotword('hey_edison');
		this.hotword.addHotword('porcupine');
		this.hotword.addHotword('terminator');
		
		this.hotword.on('data', (intData, floatData, sampleRate, hotword) => {
			// console.log('data', intData.length, floatData.length, sampleRate, hotword);
			
			if (hotword) {
				this.app.addSpeechOutput({
					type: 'text',
					text: 'hotword: ' + hotword
				});
			}
			ipcRenderer.send('hotword-data', intData, floatData, sampleRate, hotword);
		});
		
		this.hotword.on('analyser', (analyser) => {
			var canvas = app.speechOscilloscopeRef.current;
			canvas.width = window.innerWidth;
			canvas.height = 100;
			this.analyser = new SpectrumAnalyser(analyser, canvas);
			this.analyser.setLineColor(app.theme.colors.sttColor);
			this.analyser.setBackgroundColor('#222');
			this.analyser.start();
		});
		
		// this.hotword.on('hotword', (hotword) => {
		// 	// this.app.addSpeechOutput({
		// 	// 	type: 'text',
		// 	// 	text: 'hotwordDetected '+hotword
		// 	// });
		// 	ipcRenderer.send('hotword-detected', intData, floatData, sampleRate, hotword);
		// });
		
		this.sayQueue = connectSayQueue(this, app);
		// this._playSound = connectPlaySound(this, app);
		
		window.systemError = (error) => {
			this.console(error);
		}
		
		// receive speech recognition result by a synchronous message from public/electron.js
		// window.hotwordAssistantApp = (assistant, appInfo) => {
		// 	this.setActiveAssistantApp(assistant, appInfo);
		// };

		window.hotwordAssistant = (hotword, assistantName, activeApp) => {
			this.setActiveAssistant(hotword, assistantName, activeApp);
		}
		window.hotwordDetected = (hotword) => {
			// this.app.addSpeechOutput('hotwordDetected '+hotword);
			// this.setHotwordDetected(hotword);
			
			debugger;
		};
		
		window.hotwordResults = (hotword, text, stats) => {
			// debugger;
			this.app.addSpeechOutput('hotwordCommand '+hotword+' '+text);
			
			if (!text) {
				// debugger;
				this.app.addSpeechOutput({
					text: '---',
					stats,
					type: 'command'
				});
			}
			else {
				// debugger;
				this.app.addSpeechOutput({
					text,
					stats,
					type: 'command'
				});
			}
			this.emit('hotwordCommand', text, stats);
			// this.setHotwordDetected(null);
		};
		
		app.vadStatusRef.current.width = window.innerWidth;
		
		window.updateVADStatus = (status) => {
			if (app.vadStatusRef && app.vadStatusRef.current) {
				drawVADCanvas(app.vadStatusRef.current, status);
			}
			else {
				console.log('no vadStatusRef');
				debugger;
			}
		};

		window.updateClientConfig = (config) => {
			this.app.setElectronConfig(config);
		}
		window.deepspeechResults = (text, stats) => {
			// debugger;
			
			if (this.app.state.activeAssistant) {
				console.log('activeAssistant results', text, stats);
			}
			else {
				console.log('deepspeech results', text, stats);
				this.console({
					text,
					stats,
					type: 'stt'
				});
			}
			// if (stats.hotword) {
			// 	debugger;
			// 	// this.emit('hotwordRecognize', text, stats);
			// }
			// else {
			// 	this.emit('recognize', text, stats);
			// }
			
			// this.setHotwordDetected(null);
		};

		window.displayConsole = (component) => {
			this.app.console(component);
		};

	}
	
	addAssistant(hotword, appName, assistantFunction) {
		const apps = {};
		// apps[appName] = assistantFunction;
		this.assistants[hotword] = {
			name: appName,
			assistant: assistantFunction,
			hotword,
			apps
		}
	}
	removeAssistant(hotword) {
		//todo: this.assistants[hotword].destroy();
		delete this.assistants[hotword];
		delete this.apps[hotword];
	}
	
	addApp(hotword, appName, appFunction) {
		if (this.assistants[hotword]) {
			this.assistants[hotword].apps[appName] = {
				name: appName,
				app: appFunction,
				hotword
			}
		}
		else {
			debugger;
		}
	}
	
	// displayApp(hotword, appName, logo) {
	// 	this.app.displayApp(hotword, appName, logo);
	// }
	
	// async launchAssistant(hotword) {
	// 	debugger;
	// 	// debugger;
	// 	// if (!this.assistants[hotword]) {
	// 	// 	this.assistants[hotword] = new BumblebeeAssistant(hotword);
	// 	// 	return this.assistants[hotword].main(this);
	// 	// }
	// 	// else {
	// 	//
	// 	// }
	// 	// return this.launch(hotword, null, true);
	// }
	
	async launchApp(fn) {
	
	}
	
	async launch(hotword, appName, isAssistant) {
		let r;
		// debugger;
		
		if (!this.assistants[hotword]) {
			await this.say('there is no assistant for ' + hotword);
			// debugger;
			throw new Error('invalid assistant');
		}
		
		let appInfo;
		if (appName === null && isAssistant) {
			appInfo = this.assistants[hotword];
		}
		else appInfo = this.assistants[hotword].apps[appName];
		
		if (!appInfo) {
			await this.say('there is no application named ' + appInfo.name);
			// debugger;
			throw new Error('invalid app');
		}
		
		this.console('launching: ' + hotword+':'+appInfo.name);
		
		const previousAppInfo = this.currentAppInfo;
		
		const type = isAssistant? 'assistant' : 'application';
		const description = appInfo.name + ' ' + type;
		
		if (isAssistant) await this.say('starting the '+description);
		else await this.say('launching the ' + description);
		
		// debugger;
		
		try {
			
			this.currentAppInfo = appInfo;
			
			if (isAssistant) {
				// debugger;
				r = await appInfo.assistant(this);
			}
			else if (appInfo.app) {
				// debugger;
				r = await appInfo.app(this);
			}
			
			let previousName = previousAppInfo? previousAppInfo.name : 'main menu';
			await this.say('The ' + appInfo.name + ' ' + type + ' has ended returning to ' + previousName);
			
		} catch (e) {
			if (e.error && e.error.timedOut) {
				let previousName = previousAppInfo? previousAppInfo.name : 'main menu';
				await this.say('the ' + description + ' has timed out, returning to ' + previousName);
			}
			else {
				console.error(e);
				this.console('Error: ' + e.toString());
				debugger;
				await this.say('the ' + description + ' encountered an error');
			}
			r = false;
		}
		
		this.currentAppInfo = previousAppInfo;
		
		return r;
	}
	
	console(component) {
		this.app.console(component);
	}
	
	async playSound() {
		return this.sayQueue.playSound(...arguments);
	}
	async say() {
		return this.sayQueue.say(...arguments);
	}
	
	setSayProfile(profile) {
		this.sayQueue.setProfile(profile);
	}
	
	simulateHotword(text) {
		// debugger;
		ipcRenderer.send('simulate-hotword', text);
		// let hotword = this.app.state.activeAssistant;
		// if (hotword) ipcRenderer.send('simulate-hotword', text, hotword);
		// else {
		// 	console.log('no assistant');
		// }
		
		// this.app.setMuted(true);
		// setTimeout(() => {
		// 	this.app.setMuted(false);
		// },1000);
	}
	
	simulateTTS(text) {
		ipcRenderer.send('say', text);
	}
	
	simulateSTT(text) {
		if (this.app.state.muted) {
			this.console('muted');
			return;
		}
		// debugger;
		// this.app.setConsoleInputText(text);
		ipcRenderer.send('simulate-stt', text);
	}
	
	// changeHotword(value) {
	// 	let hotword = value;
	// 	let hotwordEnabled = true;
	// 	if (value === 'OFF') {
	// 		hotwordEnabled = false;
	// 	}
	// 	this.app.setState({
	// 		hotword,
	// 		hotwordEnabled
	// 	});
	// 	ipcRenderer.send('hotword-select', hotword);
	// }
	
	toggleRecording() {
		if (this.app.state.recording) this.stopRecording()
		else this.startRecording();
	}
	
	startRecording() {
		if (!this.app.state.config.deepspeechInstalled) {
			this.app.showInstall(true);
			return;
		}
		if (this.app.state.recording) {
			console.log('already recording')
			debugger;
		}
		if (!this.app.state.recording) {
			if (this.app.state.useSystemMic) {
				// debugger;
				ipcRenderer.send('recording-start');
			}
			this.app.setState({
				recording: true
			}, () => {
				// debugger;
				// this.microphone.start();
				this.hotword.start();
				this.playSound('on');
			});
		}
		this.emit('recording-started');
	};
	
	async hotwordRecognize(options) {
		if (!options) options = {};
		return new Promise((resolve, reject) => {
			let timedOut = false;
			
			if (options.timeout) {
				let timer = setTimeout(function () {
					timedOut = true;
					reject({
						error: {
							timedOut: true
						}
					});
				}, options.timeout || 10000);
				
				this.once('hotwordCommand', function (text, stats) {
					clearTimeout(timer);
					if (!timedOut) resolve({text, stats});
				});
			}
			else {
				this.once('hotwordCommand', function (text, stats) {
					resolve({text, stats});
				});
			}
		});
	}
	
	async recognizeAny() {
		return new Promise((resolve, reject) => {
			let returned = false;
			const hotwordHandler = function (hotword) {
				if (returned) return;
				returned = true;
				// debugger;
				this.removeListener('hotwordCommand', hotwordCommandHandler);
				this.removeListener('recognize', recognizeHandler);
				resolve({
					hotword: {
						hotword
					}
				});
			};
			const hotwordCommandHandler = function (text, stats, hotword) {
				if (returned) return;
				returned = true;
				// debugger;
				this.removeListener('hotword', hotwordHandler);
				this.removeListener('recognize', recognizeHandler);
				resolve({
					hotwordCommand: {
						text, stats, hotword
					}
				});
			};
			const recognizeHandler = function (text, stats) {
				if (returned) return;
				returned = true;
				// debugger;
				this.removeListener('hotword', hotwordHandler);
				this.removeListener('hotwordCommand', hotwordCommandHandler);
				resolve({
					recognize: {
						text, stats
					}
				});
			};
			this.once('hotword', hotwordHandler);
			this.once('hotwordCommand', hotwordCommandHandler);
			this.once('recognize', recognizeHandler);
		});
	}
	
	async recognize(options) {
		if (!options) options = {};
		return new Promise((resolve, reject) => {
			let timedOut = false;
			
			if (options.timeout) {
				let timer = setTimeout(function () {
					timedOut = true;
					reject({
						error: {
							timedOut: true
						}
					});
				}, options.timeout || 10000);
				
				this.once('recognize', function (text, stats) {
					clearTimeout(timer);
					if (!timedOut) resolve({text, stats});
				});
			}
			else {
				this.once('recognize', function (text, stats) {
					resolve({text, stats});
				});
			}
		});
	}
	
	setActiveAssistantApp(assistant, appInfo) {
		this.app.updateConfig();
		this.app.updateBanner();
		
		// this.app.setState({
		// 	activeAssistantApp: activeApp
		// }, () => {
		// 	this.app.updateBanner();
		// });
	}
	setActiveAssistant(hotword, assistantName, activeApp) {
		this.app.updateConfig();
		this.app.updateBanner();
		// if (this.app.state.activeAssistant !== hotword) {
		// 	this.app.setState({
		// 		activeAssistant: hotword,
		// 		activeAssistantName: assistantName,
		// 		activeAssistantApp: activeApp
		// 	}, () => {
		// 		this.app.updateBanner();
		// 	});
		// }
	}
	
	// setHotwordDetected(hotword) {
	// 	if (hotword) {
	// 		this.emit('hotword', hotword);
	// 	}
	// 	if (this.app.state.hotwordDetected !== hotword) {
	// 		if (hotword) {
	// 			// this.app.addSpeechOutput({
	// 			// 	hotword,
	// 			// 	type: 'hotword'
	// 			// });
	// 		}
	// 		this.app.setState({
	// 			hotwordDetected: hotword,
	// 			logo: hotword ? this.app.logos.hotword : this.app.logos.default
	// 		});
	// 		if (hotword) {
	// 			if (this.analyser) this.analyser.setLineColor('#d6bc22');
	// 		}
	// 		else {
	// 			if (this.analyser) this.analyser.setLineColor('#fff');
	// 		}
	// 	}
	// }
	
	async onRecordingStarted() {
		return new Promise((resolve, reject) => {
			this.once('recording-started', resolve);
		});
	}
	
	async onRecordingStopped() {
		return new Promise((resolve, reject) => {
			this.once('recording-stopped', resolve);
		});
	}
	
	stopRecording() {
		if (!this.app.state.config.deepspeechInstalled) {
			return;
		}
		
		if (this.app.state.recording) {
			if (this.app.state.useSystemMic) {
				ipcRenderer.send('recording-stop');
			}
			clearInterval(this.app.recordingInterval);
			this.app.setState({
				recording: false
			}, () => {
				// this.microphone.stop();
				this.hotword.stop();
				if (this.analyser) this.analyser.stop();
				if (this.app.vadStatusRef) clearVADCanvas(this.app.vadStatusRef.current);
				this.playSound('off');
			});
		}
		this.emit('recording-stopped');
	};
	
	setMuted(muted) {
		this.app.setState({
			muted
		});
		// this.microphone.setMuted(muted);
		this.hotword.setMuted(muted);
		if (this.app.state.useSystemMic) {
			ipcRenderer.send('microphone-muted', muted);
		}
	}
	
	toggleMute() {
		this.app.setMuted(!this.app.state.muted);
	};
	
	clearConsole() {
		this.app.setState({recognitionOutput: []});
	}
	
	playSoundNode(name, theme) {
		ipcRenderer.send('play-sound', name, theme).then(r => {
			debugger;
		});
	}
	
}

export default BumblebeeClient;