'use client';

import { useEffect } from 'react';

import { PHONE_ERROR, PHONE_MAX_DIGITS, PHONE_PATTERN, cleanPhoneInput } from '@/utils/phone';

/*
 * Site-wide guard for every <input type="tel">: letters and symbols cannot
 * be typed or pasted (only digits, a leading "+", spaces and "-"), and at
 * most 15 digits. Works with React controlled inputs because blocked keys
 * never change the value.
 *
 * Inputs without a pattern also get the shared phone pattern, so forms that
 * use the browser's validation reject numbers like "12345". Inputs typed
 * next to a separate country code (inputMode="numeric") keep their own
 * checks; data-phone-guard="off" skips an input completely.
 */
const isPhoneInput = (element) =>
    element instanceof HTMLInputElement &&
    element.type === 'tel' &&
    element.dataset.phoneGuard !== 'off';

const digitCount = (text) => (String(text).match(/\d/g) || []).length;

export default function PhoneInputGuard() {
    useEffect(() => {
        const onBeforeInput = (event) => {
            const input = event.target;
            if (!isPhoneInput(input) || !event.inputType?.startsWith('insert') || event.data == null) return;

            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? start;
            const next = input.value.slice(0, start) + event.data + input.value.slice(end);
            const numericOnly = input.inputMode === 'numeric';
            const max = Math.min(input.maxLength > 0 ? input.maxLength : PHONE_MAX_DIGITS, PHONE_MAX_DIGITS);

            const allowed = numericOnly
                ? /^\d*$/.test(event.data)
                : /^[\d\s+-]*$/.test(event.data) && !/\+/.test(next.slice(1)) && !/^[\s-]/.test(next);

            if (!allowed || digitCount(next) > max) event.preventDefault();
        };

        const onPaste = (event) => {
            const input = event.target;
            if (!isPhoneInput(input)) return;
            const text = event.clipboardData?.getData('text') ?? '';
            const start = input.selectionStart ?? input.value.length;
            let cleaned = input.inputMode === 'numeric' ? text.replace(/\D/g, '') : cleanPhoneInput(text);
            if (start > 0) cleaned = cleaned.replace(/^\+/, '');
            const room = PHONE_MAX_DIGITS - digitCount(input.value.slice(0, start) + input.value.slice(input.selectionEnd ?? start));
            let kept = 0;
            cleaned = [...cleaned].filter((char) => !/\d/.test(char) || ++kept <= room).join('');
            if (cleaned === text) return;
            event.preventDefault();
            // goes through the normal input event, so React state updates
            document.execCommand('insertText', false, cleaned);
        };

        const arm = (input) => {
            if (!isPhoneInput(input)) return;
            if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'tel');
            if (input.inputMode !== 'numeric' && !input.hasAttribute('pattern')) {
                input.setAttribute('pattern', PHONE_PATTERN);
                if (!input.title) input.title = PHONE_ERROR;
            }
        };
        const onFocusIn = (event) => arm(event.target);

        // before the browser validates a form: also phone fields never focused
        const armForm = (form) => form?.querySelectorAll?.('input[type="tel"]').forEach(arm);
        const onPointerDown = (event) => {
            const button = event.target?.closest?.('button, input[type="submit"]');
            if (button && (button.type === 'submit' || button.getAttribute('type') === null)) armForm(button.form);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Enter' && event.target?.form) armForm(event.target.form);
        };

        document.addEventListener('beforeinput', onBeforeInput, true);
        document.addEventListener('paste', onPaste, true);
        document.addEventListener('focusin', onFocusIn, true);
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
            document.removeEventListener('beforeinput', onBeforeInput, true);
            document.removeEventListener('paste', onPaste, true);
            document.removeEventListener('focusin', onFocusIn, true);
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, []);

    return null;
}
