export interface AvatarOption {
    emoji: string;
    title: string;
    webpUrl: string;
    gifUrl: string;
}

const getNotoEmojiUrl = (code: string, extension: 'webp' | 'gif') => {
    return `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.${extension}`;
};

const getEmojiCode = (emoji: string) => {
    return Array.from(emoji)
        .map((symbol) => symbol.codePointAt(0)?.toString(16))
        .filter(Boolean)
        .join('_');
};

const createAvatarOption = (emoji: string, title: string): AvatarOption => {
    const code = getEmojiCode(emoji);

    return {
        emoji,
        title,
        webpUrl: getNotoEmojiUrl(code, 'webp'),
        gifUrl: getNotoEmojiUrl(code, 'gif'),
    };
};

export const defaultAvatarEmoji = '🧑🏿‍💻';

export const avatarOptions: AvatarOption[] = [
    // Коты
    createAvatarOption('😺', 'Котик'),
    createAvatarOption('😻', 'Влюблённый кот'),
    createAvatarOption('😹', 'Кот смеётся'),
    createAvatarOption('🙀', 'Кот в шоке'),

    // Макаки / обезьянки
    createAvatarOption('🙈', 'Не вижу'),
    createAvatarOption('🙉', 'Не слышу'),
    createAvatarOption('🙊', 'Не скажу'),

    // Эмоции / реакции
    createAvatarOption('😎', 'Крутой'),
    createAvatarOption('🥳', 'Тусовщик'),
    createAvatarOption('🤩', 'В восторге'),
    createAvatarOption('😈', 'Хитрый'),
    createAvatarOption('🔥', 'Огонь'),
    createAvatarOption('💥', 'Взрыв'),
];

export const avatarEmojiOptions = avatarOptions.map((option) => option.emoji);

export const getAvatarOptionByEmoji = (emoji?: string | null) => {
    return (
        avatarOptions.find((option) => option.emoji === emoji) ??
        avatarOptions.find((option) => option.emoji === defaultAvatarEmoji) ??
        avatarOptions[0]
    );
};

export const isKnownAvatarEmoji = (emoji: string) => {
    return avatarEmojiOptions.includes(emoji);
};