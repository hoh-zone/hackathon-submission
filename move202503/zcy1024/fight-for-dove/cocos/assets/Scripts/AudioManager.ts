import {Node, AudioSource, AudioClip, resources, director} from "cc";

export class AudioManager {
    private static _inst: AudioManager;
    public static get inst() {
        return this._inst ? this._inst : (this._inst = new AudioManager());
    }

    private readonly _audioSource: AudioSource;
    public get audioSource() {
        return this._audioSource;
    }

    constructor() {
        const AudioManager = new Node();
        AudioManager.name = "__AudioManager__";
        director.getScene().addChild(AudioManager);
        director.addPersistRootNode(AudioManager);
        this._audioSource = AudioManager.addComponent(AudioSource);
    }

    playOneShot(sound: AudioClip | string, volume: number = 1) {
        if (sound instanceof AudioClip) {
            this._audioSource.playOneShot(sound, volume);
        } else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                } else {
                    this._audioSource.playOneShot(clip, volume);
                }
            });
        }
    }

    play(sound: AudioClip | string, loop: boolean = true, volume: number = 1) {
        if (sound instanceof AudioClip) {
            this._audioSource.stop();
            this._audioSource.clip = sound;
            this._audioSource.loop = loop;
            this._audioSource.play();
            this._audioSource.volume = volume;
        } else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                } else {
                    this._audioSource.stop();
                    this._audioSource.clip = clip;
                    this._audioSource.loop = loop;
                    this._audioSource.play();
                    this._audioSource.volume = volume;
                }
            });
        }
    }

    stop() {
        this._audioSource.stop();
    }

    pause() {
        this._audioSource.pause();
    }

    resume() {
        this._audioSource.play();
    }
}