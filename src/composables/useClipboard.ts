import { ref } from 'vue';

export const useClipboard = () => {
  const isCopied = ref(false);

  const fallbackCopyText = (text: string) => {
    const textarea = document.createElement('textarea');

    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const isSuccessful = document.execCommand('copy');

    document.body.removeChild(textarea);

    return isSuccessful;
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard && document.hasFocus()) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopyText(text);
      }

      isCopied.value = true;

      setTimeout(() => {
        isCopied.value = false;
      }, 2000);
    } catch {
      fallbackCopyText(text);

      isCopied.value = true;

      setTimeout(() => {
        isCopied.value = false;
      }, 2000);
    }
  };

  return {
    isCopied,
    copyText,
  };
};