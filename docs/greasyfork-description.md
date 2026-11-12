Browse a local folder of photos and videos with previews, then attach any file, or a random one, to the message box on **X** and **Discord**, without opening the native file picker each time.

> **Chrome or Edge only.** Folder access uses the File System Access API, which Firefox and Safari do not support.

## Privacy

- Your files never leave your browser except through the post or message you send yourself.
- The script makes **no network requests**, loads no remote code and sends no analytics.
- It stores only the folder permission and a small index (file size, date, video length) in the site's browser storage, and your layout and shuffle settings in your userscript manager. Nothing identifies you.
- To reach a chat inside an embedded frame, it may pass the chosen file to frames on x.com, twitter.com or discord.com only, never to other sites.
- Debug logging is off by default and never records file names.
- To remove everything, delete the script in your userscript manager and clear the site data for x.com and discord.com.

## How to use

1. Install the script (Tampermonkey or Violentmonkey, in Chrome or Edge).
2. Open x.com or discord.com and click the floating dice button.
3. Pick your media folder once. If Chrome offers "Allow on every visit", accept it.
4. Click into the message box, then click a tile to attach it, or press the dice for a random file.

| Action | How |
|---|---|
| Open or close the panel | Dice button, or `Alt+Shift+M` |
| Attach a random file | Dice in the panel, or `Alt+Shift+R` (avoids recent picks) |
| Attach several files | Select mode or Ctrl/⌘-click, up to 4, then **Attach** |
| Big preview | Hover a tile, click expand; `←` `→` move, `Enter` attaches |
| Search, filter, sort | Search box and the Type, Length, Size and Sort chips |
| Shuffle | Shuffle button or `Alt+Shift+S` |

On Discord the size filter defaults to 10 MB, the free upload limit. Subfolders are not scanned yet.

## Problems

X and Discord change their pages often. If attaching stops working, please post on the **Feedback** tab of this page with the site, browser and what you clicked.

MIT licensed. The code is readable and unminified; see the **Code** tab.

---

Not affiliated with, endorsed by, or sponsored by X Corp. or Discord Inc. Both names are trademarks of their owners and are used only to say where the script works.
