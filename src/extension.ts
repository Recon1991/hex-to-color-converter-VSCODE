// Import VSCode API
import * as vscode from 'vscode';

// Conversion Functions
function hexToRgb(hex: string, alpha: number | null = null): string | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
        const r = parseInt(match[1], 16);
        const g = parseInt(match[2], 16);
        const b = parseInt(match[3], 16);
        return alpha !== null
            ? `rgba(${r}, ${g}, ${b}, ${alpha})`
            : `rgb(${r}, ${g}, ${b})`;
    }
    return null;
}

function hexToHsl(hex: string): string | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
        const r = parseInt(match[1], 16) / 255;
        const g = parseInt(match[2], 16) / 255;
        const b = parseInt(match[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (delta !== 0) {
            s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / delta + 2;
                    break;
                case b:
                    h = (r - g) / delta + 4;
                    break;
            }
            h /= 6;
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        const lightness = Math.round(l * 100);

        return `hsl(${h}, ${s}%, ${lightness}%)`;
    }
    return null;
}

function hexToCmyk(hex: string): string | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
        const r = parseInt(match[1], 16) / 255;
        const g = parseInt(match[2], 16) / 255;
        const b = parseInt(match[3], 16) / 255;

        const k = 1 - Math.max(r, g, b);
        const c = (1 - r - k) / (1 - k) || 0;
        const m = (1 - g - k) / (1 - k) || 0;
        const y = (1 - b - k) / (1 - k) || 0;

        return `cmyk(${(c * 100).toFixed(1)}%, ${(m * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%, ${(k * 100).toFixed(1)}%)`;
    }
    return null;
}

function hexToHex8(hex: string, alpha: number = 1): string | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
        const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return `#${match[1]}${match[2]}${match[3]}${a}`;
    }
    return null;
}

function hexToHsb(hex: string): string | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
        const r = parseInt(match[1], 16) / 255;
        const g = parseInt(match[2], 16) / 255;
        const b = parseInt(match[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        const brightness = Math.round(max * 100);
        const saturation = max === 0 ? 0 : Math.round((delta / max) * 100);

        let hue = 0;
        if (delta !== 0) {
            switch (max) {
                case r:
                    hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
                    break;
                case g:
                    hue = ((b - r) / delta + 2) * 60;
                    break;
                case b:
                    hue = ((r - g) / delta + 4) * 60;
                    break;
            }
        }

        return `hsb(${Math.round(hue)}, ${saturation}%, ${brightness}%)`;
    }
    return null;
}

function hexToHwb(hex: string): string | null {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (match) {
        const r = parseInt(match[1], 16) / 255;
        const g = parseInt(match[2], 16) / 255;
        const b = parseInt(match[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const whiteness = Math.round(min * 100);
        const blackness = Math.round((1 - max) * 100);

        let hue = 0;
        if (max !== min) {
            switch (max) {
                case r:
                    hue = ((g - b) / (max - min) + (g < b ? 6 : 0)) * 60;
                    break;
                case g:
                    hue = ((b - r) / (max - min) + 2) * 60;
                    break;
                case b:
                    hue = ((r - g) / (max - min) + 4) * 60;
                    break;
            }
        }

        return `hwb(${Math.round(hue)}, ${whiteness}%, ${blackness}%)`;
    }
    return null;
}

// Activate Function
export function activate(context: vscode.ExtensionContext) {
    const configuration = vscode.workspace.getConfiguration('hexToColorConverter');
    const enabledFormats: string[] = configuration.get('enabledFormats', []);
    const showConfirmPrompt: boolean = configuration.get('showConfirmPrompt', true);

    enabledFormats.forEach((format) => {
        const commandId = `extension.convertHexTo${format}`;

        const disposable = vscode.commands.registerCommand(commandId, async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active text editor.');
                return;
            }

            const document = editor.document;
            const position = editor.selection.active;
            const wordRange = document.getWordRangeAtPosition(position, /#?[0-9A-Fa-f]{3,8}/);

            if (!wordRange) {
                vscode.window.showErrorMessage('No hex code found at cursor.');
                return;
            }

            const hex = document.getText(wordRange).trim();
            if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
                vscode.window.showErrorMessage('Invalid hex code.');
                return;
            }

            let converted: string | null = null;

            switch (format) {
                case 'RGB':
                    converted = hexToRgb(hex);
                    break;
                case 'RGBA':
                    const alphaInput = await vscode.window.showInputBox({
                        prompt: 'Enter alpha value (0-1) or leave blank for 1',
                    });
                    converted = hexToRgb(hex, alphaInput ? parseFloat(alphaInput) : 1);
                    break;
                case 'HSL':
                    converted = hexToHsl(hex);
                    break;
                case 'HSB':
                    converted = hexToHsb(hex);
                    break;
                case 'HWB':
                    converted = hexToHwb(hex);
                    break;
                case 'CMYK':
                    converted = hexToCmyk(hex);
                    break;
                case 'HEX8':
                    const alphaHexInput = await vscode.window.showInputBox({
                        prompt: 'Enter alpha value (0-1) or leave blank for 1',
                    });
                    converted = hexToHex8(hex, alphaHexInput ? parseFloat(alphaHexInput) : 1);
                    break;
            }

            if (!converted) {
                vscode.window.showErrorMessage('Conversion failed.');
                return;
            }

            if (showConfirmPrompt) {
                const confirm = await vscode.window.showInformationMessage(
                    `Replace "${hex}" with "${converted}"?`,
                    { modal: true },
                    'Yes'
                );
                if (confirm !== 'Yes') {
                    return;
                }
            }

            editor.edit((editBuilder) => {
                editBuilder.replace(wordRange, converted!);
            });
        });

        context.subscriptions.push(disposable);
    });
}

// Deactivate Function
export function deactivate() {}
