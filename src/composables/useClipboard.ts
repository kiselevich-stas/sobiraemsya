import { ref } from 'vue';

export const useClipboard = () => {
  const isCopied = ref(false);

  const copyText = async (text: string) => {
    if (!navigator.clipboard) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    } else {
      await navigator.clipboard.writeText(text);
    }

    isCopied.value = true;
    window.setTimeout(() => {
      isCopied.value = false;
    }, 1800);
  };

  return {
    isCopied,
    copyText,
  };
};
