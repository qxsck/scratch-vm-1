const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const log = require('../../util/log');
const Cast = require('../../util/cast');

// From the folders addon
// Was originally written by me, so GPL need not apply
const DIVIDER = '//';
const getFolderFromName = name => {
    const idx = name.indexOf(DIVIDER);
    if (idx === -1 || idx === 0) {
        return null;
    }
    return name.substr(0, idx);
};

const startsWithFolder = (objectName, folderName) => objectName.startsWith(`${folderName}${DIVIDER}`);

class LazySpriteLoading {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        return {
            id: 'twlazy',
            name: 'Lazy Loading',
            blocks: [
                {
                    opcode: 'load',
                    text: 'load sprite [sprite]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        sprite: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Sprite Name',
                            menu: 'spriteMenu'
                        }
                    }
                },
                {
                    opcode: 'loadFolder',
                    text: 'load sprite folder [folder]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        folder: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Folder Name',
                            menu: 'folderMenu'
                        }
                    }
                },

                '---',

                {
                    opcode: 'isLazyLoadable',
                    text: 'is this sprite marked as lazy loadable?',
                    blockType: BlockType.BOOLEAN
                },
                {
                    opcode: 'setLazyLoadable',
                    text: 'mark this sprite as [ENABLED]',
                    arguments: {
                        ENABLED: {
                            type: ArgumentType.STRING,
                            defaultValue: 'true',
                            menu: 'enabledMenu'
                        }
                    }
                }
            ],
            menus: {
                spriteMenu: {
                    acceptReporters: true,
                    items: 'getSpriteOptions'
                },
                folderMenu: {
                    acceptReporters: true,
                    items: 'getFolderOptions'
                },
                enabledMenu: {
                    acceptReporters: true,
                    items: [
                        {
                            text: 'lazy loadable',
                            value: 'true'
                        },
                        {
                            text: 'not lazy loadable',
                            value: 'false'
                        }
                    ]
                }
            }
        };
    }

    getSpriteOptions () {
        const options = [];
        for (const target of this.runtime.targets) {
            if (!target.isOriginal) {
                continue;
            }
            const name = target.getName();
            if (target.lazyLoading) {
                options.push({
                    text: name,
                    value: name
                });
            } else if (!target.isStage) {
                options.push({
                    text: `${name} (already loaded)`,
                    value: name
                });
            }
        }
        return options;
    }

    getFolderOptions () {
        const folderNames = new Set();
        for (const target of this.runtime.targets) {
            if (!target.isOriginal) {
                continue;
            }
            const name = target.getName();
            if (target.lazyLoading) {
                const folder = getFolderFromName(name);
                if (folder) {
                    folderNames.add(folder);
                }
            } else if (!target.isStage) {
                const folder = getFolderFromName(name);
                if (folder) {
                    folderNames.add(folder);
                }
            }
        }
        if (folderNames.size === 0) {
            return [
                {
                    text: 'Project contains no folders',
                    value: ''
                }
            ];
        }
        return Array.from(folderNames).map(i => ({
            text: i,
            value: i
        }));
    }

    _load (name) {
        const target = this.runtime.getSpriteTargetByName(name);
        if (!target) {
            return;
        }

        return target.unlazy()
            .then(() => {
                this.runtime.startHats('event_whenflagclicked', {}, target);
            })
            .catch(err => {
                log.error('lazy loading failed', err);
            });
    }

    load (args) {
        return this._load(args.sprite);
    }

    loadFolder (args) {
        const namesToLoad = [];
        for (const target of this.runtime.targets) {
            if (!target.isOriginal) {
                continue;
            }
            const name = target.getName();
            if (startsWithFolder(name, args.folder)) {
                namesToLoad.push(name);
            }
        }
        return Promise.all(namesToLoad.map(i => this._load(i)));
    }

    isLazyLoadable (args, util) {
        return util.target.shouldBeLazyLoaded;
    }

    setLazyLoadable (args, util) {
        const enabled = Cast.toBoolean(args.ENABLED);
        util.target.shouldBeLazyLoaded = enabled;
    }
}

module.exports = LazySpriteLoading;
