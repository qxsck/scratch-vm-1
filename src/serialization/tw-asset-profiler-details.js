const forCostume = (spriteName, costume) => ({
    type: 'costume',
    sprite: spriteName,
    asset: costume
});

const forSound = (spriteName, sound) => ({
    type: 'sound',
    sprite: spriteName,
    asset: sound
});

const forFont = font => ({
    type: 'font',
    asset: font
});

module.exports = {
    forCostume,
    forSound,
    forFont
};
