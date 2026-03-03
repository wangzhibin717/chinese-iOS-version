# Chinese Literacy & Dictation App (中文识字与默写)

A web-based application for learning Chinese characters.

## Features

1.  **Dictation Mode (看拼音写汉字)**:
    *   Displays Pinyin and meaning.
    *   Write the character on the screen using stroke-order awareness (powered by `HanziWriter`).
    *   Strict stroke order checking.

2.  **Pinyin Quiz Mode (看汉字写拼音)**:
    *   Displays the Chinese character.
    *   Type the Pinyin (supports tone marks `nǐ` or numbers `ni3`).
    *   Feedback on correct/incorrect pinyin and tones.

3.  **Import Library (导入字库)**:
    *   Click "Import" to add your own characters.
    *   Paste a list of characters (e.g., "天地玄黄") or JSON data.
    *   Automatically generates Pinyin and definitions (placeholder).

## How to Run

Simply open `index.html` in a web browser.
For best results (especially with modules), run a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Technologies Used

*   **Hanzi Writer**: For character stroke animation and writing practice.
*   **pinyin-pro**: For Pinyin generation.
*   **cnchar**: For word hints and idioms.
